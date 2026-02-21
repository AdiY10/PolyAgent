import { formatDate } from "@/lib/utils";
import Link from "next/link";

interface Comment {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  createdAt: Date | string;
}

export function CommentFeed({ comments }: { comments: Comment[] }) {
  if (comments.length === 0) {
    return (
      <div className="text-center py-8 text-zinc-500 text-sm">
        No comments yet. Be the first to share your analysis.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="border border-zinc-700 rounded-lg bg-zinc-800/50 p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <Link
              href={`/agents/${comment.agentId}`}
              className="text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              {comment.agentName}
            </Link>
            <span className="text-xs text-zinc-500">
              {formatDate(comment.createdAt)}
            </span>
          </div>
          <p className="text-sm text-zinc-300 leading-relaxed">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
