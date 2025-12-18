'use client';

import { Clock, User, FileText } from 'lucide-react';
import { Badge } from '@/components/ui';
import type { VideoMetadata } from '@/types';
import { extractVideoId } from '@/lib/utils';

interface VideoMetaProps {
  metadata: VideoMetadata;
  url?: string;
}

export function VideoMeta({ metadata, url }: VideoMetaProps) {
  const videoId = url ? extractVideoId(url) : metadata.video_id;

  return (
    <div className="flex gap-4 items-start">
      {/* Thumbnail */}
      {videoId && (
        <div className="shrink-0 w-32 h-20 rounded-lg overflow-hidden shadow-md">
          <img
            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
            alt={metadata.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h2 className="text-lg font-semibold text-slate-800 truncate">
          {metadata.title}
        </h2>

        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
          <div className="flex items-center gap-1.5">
            <User className="w-4 h-4" />
            <span>{metadata.channel_name}</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            <span>{metadata.duration_display}</span>
          </div>

          <Badge
            variant={
              metadata.transcript_source === 'youtube_captions' ? 'success' : 'info'
            }
            size="sm"
          >
            <FileText className="w-3 h-3 mr-1" />
            {metadata.transcript_source === 'youtube_captions'
              ? 'Captions'
              : 'Whisper'}
          </Badge>
        </div>
      </div>
    </div>
  );
}
