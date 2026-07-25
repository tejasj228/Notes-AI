import { NextResponse } from 'next/server';

export const json = (data, status = 200) => NextResponse.json(data, { status });

export const ok = (data, status = 200) => NextResponse.json({ success: true, ...data }, { status });

export const fail = (message, status = 500) =>
  NextResponse.json({ success: false, message }, { status });
