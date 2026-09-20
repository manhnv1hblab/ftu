import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full rounded-3xl border border-surface-container bg-surface-container-lowest p-8 text-center shadow-sm">
        <p className="text-xs font-bold uppercase tracking-wider text-primary">FTU GoGlobal</p>
        <h1 className="mt-3 text-2xl font-extrabold text-on-surface">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-on-surface-variant">
          Đường dẫn này không tồn tại hoặc đã được thay đổi. Bạn có thể quay về planner để tiếp tục bản nháp.
        </p>
        <Link href="/planner" className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-bold text-on-primary">
          Về lập kế hoạch
        </Link>
      </div>
    </main>
  );
}
