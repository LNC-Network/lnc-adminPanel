import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { MongoServerError } from "mongodb";

interface FormData {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    institution: string;
    portfolio: string;
    role: string;
    status: string;
    about: string;
}
export async function POST(req: Request) {
    try {
        const client = await clientPromise;
        const db = client.db(process.env.MONGODB_DB_NAME as string);
        const collection = db.collection(
            process.env.MONGODB_COLLECTION_NAME as string
        );

        const data: FormData = await req.json();
        const result = await collection.insertOne(data);

        return NextResponse.json({ success: true, result });
    } catch (error) {
        console.error(error);
        if (error instanceof MongoServerError) {
            return NextResponse.json(
                { success: false, error: "Database error" },
                { status: 500 }
            );
        }
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}
