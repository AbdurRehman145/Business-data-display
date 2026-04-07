import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db('google_maps_scraper');
    const collection = db.collection('businesses');

    const cities = await collection.distinct('city');
    const validCities = cities.filter(c => c && typeof c === 'string' && c.trim() !== '').sort();

    return NextResponse.json({ cities: validCities });
  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
