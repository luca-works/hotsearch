import Link from 'next/link';
import { type FC } from 'react';

const NotFound: FC = () => {
  return (
    <div className="min-h-[calc(100vh-12rem)] flex justify-center items-center">
      <div className="text-center">
        <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl">404</h1>
        <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8">看来这个页面去环球旅行了，还没寄明信片回来。</p>
        <div className="flex items-center justify-center mt-10">
          <Link
            href="/"
            className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-400"
          >
            回到首页
          </Link>
        </div>
      </div>
    </div>
  )
}
export default NotFound;
