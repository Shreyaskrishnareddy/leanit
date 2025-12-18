"""Service for deduplicating and ranking insights."""

import logging
import hashlib
from dataclasses import dataclass

import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.cluster import AgglomerativeClustering

from app.models.schemas import Insight
from app.core.config import settings

logger = logging.getLogger(__name__)


@dataclass
class ProcessedInsights:
    """Container for processed insights."""

    top_insights: list[Insight]
    additional_insights: list[Insight]
    all_insights: list[Insight]


class InsightProcessor:
    """
    Deduplicates and ranks insights using semantic similarity.

    Algorithm:
    1. Embed all insights using sentence-transformers
    2. Cluster similar insights using agglomerative clustering
    3. For each cluster, select the best representative
    4. Rank representatives by composite score
    5. Return top 5 + additional insights
    """

    def __init__(
        self,
        model_name: str = "all-MiniLM-L6-v2",
        similarity_threshold: float = 0.75,
    ):
        self._model: SentenceTransformer | None = None
        self._model_name = model_name
        self.similarity_threshold = similarity_threshold

    @property
    def model(self) -> SentenceTransformer:
        """Lazy load the model."""
        if self._model is None:
            logger.info(f"Loading sentence transformer model: {self._model_name}")
            self._model = SentenceTransformer(self._model_name)
        return self._model

    def process(
        self,
        raw_insights: list[dict],
        max_top: int | None = None,
        max_additional: int | None = None,
    ) -> ProcessedInsights:
        """
        Process raw insights into ranked, deduplicated list.

        Args:
            raw_insights: List of insight dictionaries from LLM
            max_top: Maximum number of top insights
            max_additional: Maximum number of additional insights

        Returns:
            ProcessedInsights with top and additional insights
        """
        max_top = max_top or settings.MAX_TOP_INSIGHTS
        max_additional = max_additional or settings.MAX_ADDITIONAL_INSIGHTS

        if not raw_insights:
            return ProcessedInsights([], [], [])

        logger.info(f"Processing {len(raw_insights)} raw insights")

        # Filter out low-confidence insights
        filtered_insights = [
            i for i in raw_insights if i.get("confidence") != "low"
        ]

        if not filtered_insights:
            filtered_insights = raw_insights[:max_top + max_additional]

        # Convert to structured format with metadata
        insights_with_meta = self._prepare_insights(filtered_insights)

        if len(insights_with_meta) <= 1:
            # No need for clustering with 0 or 1 insights
            final_insights = self._to_insight_models(insights_with_meta)
            return ProcessedInsights(
                top_insights=final_insights[:max_top],
                additional_insights=final_insights[max_top : max_top + max_additional],
                all_insights=final_insights[: max_top + max_additional],
            )

        # Compute embeddings
        texts = [f"{i['title']} {i['core_point']}" for i in insights_with_meta]
        embeddings = self.model.encode(texts, normalize_embeddings=True)

        # Cluster similar insights
        clusters = self._cluster_insights(embeddings)

        # Select representatives from each cluster
        representatives = self._select_representatives(
            insights_with_meta, clusters, embeddings
        )

        # Rank by importance score
        ranked = self._rank_insights(representatives)

        # Convert to output format
        final_insights = self._to_insight_models(ranked)

        logger.info(
            f"Processed to {len(final_insights)} unique insights "
            f"({len(raw_insights)} raw -> {len(np.unique(clusters))} clusters)"
        )

        return ProcessedInsights(
            top_insights=final_insights[:max_top],
            additional_insights=final_insights[max_top : max_top + max_additional],
            all_insights=final_insights[: max_top + max_additional],
        )

    def _prepare_insights(self, raw_insights: list[dict]) -> list[dict]:
        """Add metadata and normalize insights."""
        prepared = []
        for idx, insight in enumerate(raw_insights):
            confidence_map = {"high": 1.0, "medium": 0.7, "low": 0.4}
            prepared.append(
                {
                    **insight,
                    "original_index": idx,
                    "chunk_position": insight.get("chunk_index", 0),
                    "confidence_score": confidence_map.get(
                        insight.get("confidence", "medium"), 0.7
                    ),
                }
            )
        return prepared

    def _cluster_insights(self, embeddings: np.ndarray) -> np.ndarray:
        """Cluster similar insights together."""
        if len(embeddings) < 2:
            return np.array([0] * len(embeddings))

        # Compute cosine distance matrix
        similarity_matrix = embeddings @ embeddings.T
        distance_matrix = 1 - similarity_matrix

        # Ensure non-negative distances (floating point errors)
        distance_matrix = np.maximum(distance_matrix, 0)

        try:
            # Cluster with distance threshold
            clustering = AgglomerativeClustering(
                n_clusters=None,
                distance_threshold=1 - self.similarity_threshold,
                metric="precomputed",
                linkage="average",
            )
            return clustering.fit_predict(distance_matrix)
        except Exception as e:
            logger.warning(f"Clustering failed: {e}, using individual clusters")
            return np.arange(len(embeddings))

    def _select_representatives(
        self,
        insights: list[dict],
        clusters: np.ndarray,
        embeddings: np.ndarray,
    ) -> list[dict]:
        """Select best insight from each cluster."""
        representatives = []

        for cluster_id in np.unique(clusters):
            cluster_mask = clusters == cluster_id
            cluster_indices = np.where(cluster_mask)[0]
            cluster_insights = [insights[i] for i in cluster_indices]

            # Score each insight in cluster
            scores = []
            for ins in cluster_insights:
                # Composite score based on multiple factors
                score = (
                    ins["confidence_score"] * 0.4
                    + (1 - ins["chunk_position"] / max(len(insights), 1)) * 0.1
                    + min(len(ins.get("verbatim_support", "")) / 300, 1) * 0.25
                    + min(len(ins.get("core_point", "")) / 400, 1) * 0.25
                )
                scores.append(score)

            # Select highest scoring insight from cluster
            best_idx = int(np.argmax(scores))
            best_insight = cluster_insights[best_idx].copy()
            best_insight["cluster_size"] = len(cluster_indices)
            best_insight["importance_score"] = max(scores)
            representatives.append(best_insight)

        return representatives

    def _rank_insights(self, insights: list[dict]) -> list[dict]:
        """Final ranking of representative insights."""
        for ins in insights:
            # Composite ranking score
            ins["final_score"] = (
                ins.get("importance_score", 0.5) * 0.5
                + min(ins.get("cluster_size", 1) / 5, 1) * 0.3
                + ins.get("confidence_score", 0.5) * 0.2
            )

        return sorted(insights, key=lambda x: x["final_score"], reverse=True)

    def _to_insight_models(self, ranked_insights: list[dict]) -> list[Insight]:
        """Convert to API response models."""
        results = []
        for idx, ins in enumerate(ranked_insights):
            # Generate stable ID from content
            content_hash = hashlib.md5(
                f"{ins.get('title', '')}{ins.get('core_point', '')}".encode()
            ).hexdigest()[:12]

            results.append(
                Insight(
                    id=f"ins_{content_hash}",
                    rank=idx + 1,
                    title=ins.get("title", "Untitled Insight"),
                    core_point=ins.get("core_point", ""),
                    supporting_context=ins.get("verbatim_support"),
                    deep_dive_content=None,  # Populated later if needed
                    is_top_five=(idx < 5),
                )
            )

        return results
