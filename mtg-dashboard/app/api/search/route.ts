import { connectToDatabase, COLLECTIONS } from "@/app/lib/mongo";
import { NextRequest, NextResponse } from "next/server";

// app/api/search/route.ts
export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;

    // Add debug logging
    console.log("Received search request with params:", Object.fromEntries(searchParams.entries()));

    // get all possible search parameters
    const cardName = searchParams.get('name') || '';
    const setCode = searchParams.get('setCode') || '';
    const manaCost = searchParams.get('manaCost') || '';
    const rarities = searchParams.getAll('rarity'); // Can have multiple rarities
    const formats = searchParams.getAll('format'); // Can have multiple formats
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const sort = searchParams.get('sort') || 'name_asc';

    const skip = (page - 1) * pageSize;

    try {
        const { db } = await connectToDatabase();
        console.log("Building query in app/api/search/route.ts...")
        // Build MongoDB query based on all provided parameters
        const query: any = {};

        if (cardName) {
            query.name = { $regex: cardName, $options: 'i' };
        }

        if (setCode) {
            query.set = setCode.toLowerCase();
            console.log(`Added set filter: "${setCode.toLowerCase()}"`);
        }

        if (manaCost) {
            query.mana_cost = manaCost;
        }
        
        if (rarities.length > 0) {
            query.rarity = { $in: rarities.map(r => r.toLowerCase()) };
        }

        // Prepare $and conditions array if we need it for complex conditions
        const andConditions = [];

        // Handle format legality filtering
        if (formats.length > 0) {
            const formatQueries = formats.map(format => {
                const formatKey = `legalities.${format.toLowerCase()}`;
                return { [formatKey]: { $in: ['legal', 'restricted'] } };
            });

            // Add the format to andConditions
            andConditions.push({ $or: formatQueries });
        }

        if (andConditions.length > 0) {
            query.$and = andConditions;
        }

        
        // Execute the search
        const totalResults = await db.collection(COLLECTIONS.cards).countDocuments(query);

        // initialize query result variable
        let cards = [];

        // non-price sorting options
        const sortOptions: any = {};

        // Build the sort pipeline for price sorting
        let pipeline = [];

        // Handle price sorting by adding calculated fields
        if (sort === 'price_asc' || sort === 'price_desc') {
            
            // First, get the query
            pipeline.push({ $match: query });

            // Add a stage to compute the lowest non-null price for each card
            pipeline.push({
                $addFields: {
                    hasPrices: {
                        $cond: {
                            if: {
                                $or: [
                                    { $ne: ["$prices.usd", null] },
                                    { $ne: ["$prices.usd_foil", null] },
                                    { $ne: ["$prices.usd_etched", null] }
                                ]
                            },
                            then: 1,
                            else: 0
                        }
                    },                    
                    lowestPrice: {
                        $min: {
                            $filter: {
                                input: [
                                    { $toDouble: { $ifNull: ["$prices.usd", null] } },
                                    { $toDouble: { $ifNull: ["$prices.usd_foil", null] } },
                                    { $toDouble: { $ifNull: ["$prices.usd_etched", null] } }
                                ],
                                as: "price",
                                cond: { $ne: ["$$price", null] }
                            }
                        }
                    },
                    highestPrice: {
                        $max: {
                            $filter: {
                                input: [
                                    { $toDouble: { $ifNull: ["$prices.usd", null] } },
                                    { $toDouble: { $ifNull: ["$prices.usd_foil", null] } },
                                    { $toDouble: { $ifNull: ["$prices.usd_etched", null] } }
                                ],
                                as: "price",
                                cond: { $ne: ["$$price", null] }
                            }
                        }
                    }
                }
            });
            
            // filter out the records that don't have prices
            pipeline.push({
                $match: {
                    hasPrices: 1
                }
            });

            // actually do the sorting lol dumbass
            if (sort === 'price_asc') {
                pipeline.push({ $sort: { lowestPrice: 1, name: 1 } });
            } else { // price_desc
                pipeline.push({ $sort: { lowestPrice: -1, name: 1 } });
            }


            // adding pagination to pipeline output
            pipeline.push({ $skip: skip });
            pipeline.push({ $limit: pageSize });

            // execute aggregated pipeline for price sorting
            cards = await db.collection(COLLECTIONS.cards).aggregate(pipeline).toArray();
        } else { // non-price aggregation
            switch (sort) {
                case 'release_desc':
                    sortOptions.released_at = -1;
                    break;
                
                case 'release_asc':
                    sortOptions.released_at = 1;
                    break;
                
                default:
                    sortOptions.name = 1;
            }
        
    
            cards = await db.collection(COLLECTIONS.cards)
                .find(query)
                .sort(sortOptions)
                .skip(skip)
                .limit(pageSize)
                .toArray();
        }

        // For each card, get the latest price data for each finish in the card_prices collection
        const enhancedCards = await Promise.all(cards.map(async (card) => {
            // Get the latest price for each finish type
            const finishTypes = ['nonfoil', 'foil', 'etched'];
            const latestPrices: any = {};
            
            await Promise.all(finishTypes.map(async (finish) => {
                const latestPriceData = await db.collection(COLLECTIONS.card_prices)
                    .find({ 
                        card_key: card.card_key,
                        finish: finish
                    })
                    .sort({ date: -1 }) // Sort by date descending to get the latest
                    .limit(1)
                    .toArray();
                
                if (latestPriceData.length > 0) {
                    // Store latest price for this finish
                    latestPrices[finish] = {
                        price: latestPriceData[0].price,
                        date: latestPriceData[0].date
                    };
                }
            }));
            
            // Merge the latest prices into the card's prices object
            const enhancedCard = { ...card };
            
            // Initialize prices object if it doesn't exist
            if (!enhancedCard.prices) {
                enhancedCard.prices = {};
            }
            
            // Add latest prices from our timeseries collection
            if (latestPrices.nonfoil) {
                enhancedCard.latest_prices = {
                    ...enhancedCard.latest_prices,
                    nonfoil: latestPrices.nonfoil
                };
            }
            
            if (latestPrices.foil) {
                enhancedCard.latest_prices = {
                    ...enhancedCard.latest_prices,
                    foil: latestPrices.foil
                };
            }
            
            if (latestPrices.etched) {
                enhancedCard.latest_prices = {
                    ...enhancedCard.latest_prices,
                    etched: latestPrices.etched
                };
            }
            
            return enhancedCard;
        }));

    
        // Return search results with pagination info
        return NextResponse.json({
            cards: enhancedCards,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalResults / pageSize),
                totalResults,
                pageSize
            }
        });
        
    } catch (error) {
        console.error('Error searching cards:', error);
        return NextResponse.json(
            { error: 'Failed to search cards' },
            { status: 500 }
        );
    }
}