// app/api/price-history/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase, COLLECTIONS } from '@/app/lib/mongo';

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const setCode = searchParams.get('setCode');
    const collectorNumber = searchParams.get('collectorNumber');
    const days = parseInt(searchParams.get('days') || '30');
    const finish = searchParams.get('finish') || 'all';

    if (!setCode || !collectorNumber) {
        return NextResponse.json(
            { error: 'Set code and collector number are required.' },
            { status: 400 }
        );
    }

    try {
        const { db } = await connectToDatabase();

        // Generate card key
        const card_key = `${setCode.toLowerCase()}-${collectorNumber}`;
        
        // Get card details
        const card = await db.collection(COLLECTIONS.cards).findOne({ card_key });

        if (!card) {
            return NextResponse.json(
              { 
                card: null, 
                priceHistory: {
                    nonfoil: [],
                    foil: [],
                    etched: []
                } 
            },
              { status: 200 }
            );
        }

        // Calculate start date
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        // Create query based on finish selection
        let finishQuery = {};

        if (finish === 'all') {
            finishQuery = { $in: ['nonfoil', 'foil', 'etched'] };
        } else {
            finishQuery = finish;
        }

        // Get price history for selected finish(es)
        const priceHistory = await db.collection(COLLECTIONS.card_prices)
            .find({
                card_key,
                date: { $gte: startDate },
                finish: finishQuery
            })
            .sort({ date: 1 })
            .toArray();

        // Format the dates to be serializable
        const formattedPriceHistory = priceHistory.map(point => ({
            ...point,
            _id: point._id.toString(),
            date: point.date.toISOString(),
            finish: point.finish
        }));

        // Group by finish type if "all" was selected
        // TODO: the Record type here is not robust, rework with an explicit type for a formatted price point
        let priceHistoryByFinish: Record<string, any[]> = {
            nonfoil: [],
            foil: [],
            etched: []
        };
        
        if (finish === 'all') {
            // Group by finish type
            formattedPriceHistory.forEach(point => {
            const finishType = point.finish;
            if (['nonfoil', 'foil', 'etched'].includes(finishType)) {
                priceHistoryByFinish[finishType].push(point);
            }
            });
        } else {
            // Just put all points under the specific finish
            priceHistoryByFinish[finish] = formattedPriceHistory;
        }

        return NextResponse.json({
            card,
            priceHistory: priceHistoryByFinish
        });

    } catch (error) {
        console.error('Error fetching card price history:L', error);
        return NextResponse.json(
            { error: 'Failed to fetch price history' },
            { status: 500 }
        );
    }
}