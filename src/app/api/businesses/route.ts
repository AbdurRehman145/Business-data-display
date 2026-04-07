import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const hasPhone = searchParams.get('hasPhone');
    const hasWebsite = searchParams.get('hasWebsite');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = 50;

    const client = await clientPromise;
    const db = client.db('google_maps_scraper');
    const collection = db.collection('businesses');

    const query: any = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { address: { $regex: search, $options: 'i' } }
      ];
    }

    if (city && city !== 'All') {
      query.city = city;
    }

    if (hasPhone === 'mobile' || hasPhone === 'landline') {
      query.phone_type = hasPhone;
    }

    if (hasWebsite === 'yes') {
      query.website = { $ne: "N/A" };
    } else if (hasWebsite === 'no') {
      query.website = "N/A";
    }

    const total = await collection.countDocuments(query);
    const businesses = await collection
      .find(query)
      .sort({ _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      data: businesses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
