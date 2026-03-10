'use client';

// /markets redirects to home page which shows the markets
import { redirect } from 'next/navigation';

export default function MarketsRedirect() {
    redirect('/');
}
