import { NextResponse } from "next/server";
import { APP_METADATA, getAppFullName } from "@/lib/app-metadata"

export async function GET() {
  return NextResponse.json({
    app: getAppFullName(),
    version: APP_METADATA.version,
    releaseType: APP_METADATA.releaseType,
    description: APP_METADATA.description,
    status: "running"
  });
}
