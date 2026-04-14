import { NextResponse } from 'next/server';
import clientPromise from '@/lib/mongodb';

function escapeCsv(value: any) {
  if (value === null || value === undefined) {
    return '';
  }
  const str = String(value);
  // If the value contains quotes, commas, or newlines, enclose in quotes and escape internal quotes
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const city = searchParams.get('city');
    const hasPhone = searchParams.get('hasPhone');
    const hasWebsite = searchParams.get('hasWebsite');

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

    // Fetch all matching records without pagination for the export
    const businesses = await collection.find(query).sort({ _id: 1 }).toArray();

    // Construct CSV Header
    const headers = ['Business Name', 'Contact', 'Type', 'City', 'Address', 'Website'];
    let csvString = headers.join(',') + '\n';

    // Construct CSV Rows
    for (const biz of businesses) {
      const row = [
        escapeCsv(biz.name),
        escapeCsv(biz.phone !== "N/A" ? biz.phone : ""),
        escapeCsv(biz.phone_type),
        escapeCsv(biz.city),
        escapeCsv(biz.address),
        escapeCsv(biz.website !== "N/A" ? biz.website : "")
      ];
      csvString += row.join(',') + '\n';
    }

    // Return the response as a file download
    const response = new NextResponse(csvString, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="businesses_export.csv"',
      },
    });

    return response;

  } catch (e: any) {
    console.error("Export Error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
