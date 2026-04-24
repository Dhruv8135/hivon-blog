import Button from "@/components/ui/Button";

type Props = {
  page: number;
  totalPages: number;
  onPrev?: () => void;
  onNext?: () => void;
};

export default function Pagination({ page, totalPages, onPrev, onNext }: Props) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Button type="button" variant="secondary" onClick={onPrev} disabled={page <= 1}>
        Prev
      </Button>
      <div className="text-sm text-zinc-600">
        Page {page} of {totalPages}
      </div>
      <Button type="button" variant="secondary" onClick={onNext} disabled={page >= totalPages}>
        Next
      </Button>
    </div>
  );
}
