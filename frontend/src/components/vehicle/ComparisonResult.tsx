import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface ComparisonResultProps {
  content: string;
  isLoading?: boolean;
}

export function ComparisonResult({ content, isLoading }: ComparisonResultProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-5 w-48 bg-white/5 rounded-lg shimmer" />
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-3 bg-white/5 rounded-lg shimmer"
              style={{ width: `${80 - i * 15}%` }}
            />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-neon-orange" />
          Resultado de comparacion
        </h3>
      </CardHeader>
      <CardContent>
        <div className="message-content prose prose-sm prose-invert max-w-none text-xs text-white/70">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
        </div>
      </CardContent>
    </Card>
  );
}
