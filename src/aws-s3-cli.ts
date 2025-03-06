#!/usr/bin/env node

// Load environment variables from .env file
import dotenv from "dotenv";
dotenv.config();

import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  DeleteBucketCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  GetBucketLocationCommand,
  BucketLocationConstraint,
} from "@aws-sdk/client-s3";
import { fromEnv } from "@aws-sdk/credential-providers";
import { createReadStream, createWriteStream, readFileSync } from "fs";
import { Readable } from "stream";
import path from "path";
import { pipeline } from "stream/promises";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

/**
 * AWS S3 CLI utility for managing buckets and objects
 *
 * Usage requires AWS credentials to be set via:
 * - Environment variables: AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY
 * - .env file in the current directory
 * - Or AWS credentials file (~/.aws/credentials)
 */

// Load specific .env file if provided
if (process.argv.includes("--env-file")) {
  const envFileIndex = process.argv.indexOf("--env-file");
  if (envFileIndex > -1 && envFileIndex < process.argv.length - 1) {
    const envFilePath = process.argv[envFileIndex + 1];
    dotenv.config({ path: envFilePath });
    console.log(`Loaded environment from: ${envFilePath}`);
  }
}

// Initialize yargs for command line parsing
const argv = yargs(hideBin(process.argv))
  .usage("Usage: $0 <command> [options]")
  .option("region", {
    description: "AWS region to use",
    type: "string",
    default: "us-east-1",
  })
  .option("env-file", {
    description: "Path to .env file",
    type: "string",
    default: ".env",
  })
  // List buckets command
  .command("list-buckets", "List all S3 buckets", {}, listBuckets)
  // Get bucket region command
  .command(
    "get-bucket-region",
    "Get the region of a specific bucket",
    {
      name: {
        description: "Name of the bucket",
        type: "string",
        demandOption: true,
      },
    },
    getBucketRegion
  )
  // Create bucket command - FIXED to use option instead of positional arg
  .command(
    "create-bucket",
    "Create a new S3 bucket",
    {
      name: {
        description: "Name of the bucket to create",
        type: "string",
        demandOption: true,
      },
    },
    createBucket
  )
  // Delete bucket command - FIXED to use option instead of positional arg
  .command(
    "delete-bucket",
    "Delete an S3 bucket",
    {
      name: {
        description: "Name of the bucket to delete",
        type: "string",
        demandOption: true,
      },
    },
    deleteBucket
  )
  // List files command - FIXED to use option instead of positional arg
  .command(
    "list-files",
    "List files in an S3 bucket",
    {
      bucket: {
        description: "Name of the bucket",
        type: "string",
        demandOption: true,
      },
      prefix: {
        description: "Prefix to filter objects",
        type: "string",
      },
    },
    listFiles
  )
  // Upload file command - FIXED to use options instead of positional args
  .command(
    "upload-file",
    "Upload a file to S3",
    {
      bucket: {
        description: "Name of the bucket",
        type: "string",
        demandOption: true,
      },
      file: {
        description: "Path to the file to upload",
        type: "string",
        demandOption: true,
      },
      key: {
        description: "S3 object key (defaults to filename)",
        type: "string",
      },
    },
    uploadFile
  )
  // Download file command - FIXED to use options instead of positional args
  .command(
    "download-file",
    "Download a file from S3",
    {
      bucket: {
        description: "Name of the bucket",
        type: "string",
        demandOption: true,
      },
      key: {
        description: "S3 object key to download",
        type: "string",
        demandOption: true,
      },
      output: {
        description: "Output file path (defaults to the key name)",
        type: "string",
      },
    },
    downloadFile
  )
  // Delete file command - FIXED to use options instead of positional args
  .command(
    "delete-file",
    "Delete a file from S3",
    {
      bucket: {
        description: "Name of the bucket",
        type: "string",
        demandOption: true,
      },
      key: {
        description: "S3 object key to delete",
        type: "string",
        demandOption: true,
      },
    },
    deleteFile
  )
  .demandCommand(1, "You need to specify a command")
  .help()
  .alias("h", "help")
  .version()
  .alias("v", "version").argv;

/**
 * Create an S3 client with the provided region and credentials
 */
function getS3Client(region: string): S3Client {
  // Log the region to debug
  console.log(`Creating S3 client with region: ${region}`);

  // Make sure we're explicitly setting the region
  return new S3Client({
    region: region,
    credentials: fromEnv(),
  });
}

/**
 * List all S3 buckets
 */
async function listBuckets(argv: any) {
  try {
    console.log(`Using region parameter: ${argv.region}`);
    const client = getS3Client(argv.region);

    const command = new ListBucketsCommand({});
    console.log("Sending ListBucketsCommand...");

    const response = await client.send(command);

    console.log(
      "NOTE: S3 ListBucketsCommand returns ALL buckets regardless of region!"
    );
    console.log(
      `Listing all buckets (use get-bucket-region to check actual region):`
    );

    if (response.Buckets && response.Buckets.length > 0) {
      response.Buckets.forEach((bucket, index) => {
        console.log(
          `${index + 1}. ${bucket.Name} (Created: ${bucket.CreationDate})`
        );
      });
    } else {
      console.log("No buckets found.");
    }
  } catch (error) {
    console.error("Error listing buckets:", error);
    process.exit(1);
  }
}

/**
 * Get the region of a specific bucket
 */
async function getBucketRegion(argv: any) {
  try {
    // We need to use a specific region to make this API call
    // us-east-1 is a good default for this specific command
    const client = new S3Client({
      region: "us-east-1",
      credentials: fromEnv(),
    });

    console.log(`Checking region for bucket: ${argv.name}`);

    // Use GetBucketLocation to get the actual bucket region
    const command = new GetBucketLocationCommand({
      Bucket: argv.name,
    });

    const response = await client.send(command);

    // Parse the location constraint
    let region = response.LocationConstraint;

    // Empty string or null means us-east-1 (legacy S3 behavior)
    if (!region) {
      region = "us-east-1" as BucketLocationConstraint;
    }

    console.log(`Bucket '${argv.name}' is in region: ${region}`);
  } catch (error) {
    console.error(`Error getting region for bucket '${argv.name}':`, error);
    process.exit(1);
  }
}

/**
 * Create a new S3 bucket
 */
async function createBucket(argv: any) {
  try {
    const client = getS3Client(argv.region);
    const command = new CreateBucketCommand({
      Bucket: argv.name,
      CreateBucketConfiguration: {
        LocationConstraint:
          argv.region !== "us-east-1" ? argv.region : undefined,
      },
    });

    await client.send(command);
    console.log(
      `Bucket '${argv.name}' created successfully in region ${argv.region}.`
    );
  } catch (error) {
    console.error("Error creating bucket:", error);
    process.exit(1);
  }
}

/**
 * Delete an S3 bucket
 */
async function deleteBucket(argv: any) {
  try {
    const client = getS3Client(argv.region);
    const command = new DeleteBucketCommand({
      Bucket: argv.name,
    });

    await client.send(command);
    console.log(`Bucket '${argv.name}' deleted successfully.`);
  } catch (error) {
    console.error("Error deleting bucket:", error);
    process.exit(1);
  }
}

/**
 * List files in an S3 bucket
 */
async function listFiles(argv: any) {
  try {
    const client = getS3Client(argv.region);
    const command = new ListObjectsV2Command({
      Bucket: argv.bucket,
      Prefix: argv.prefix,
    });

    const response = await client.send(command);

    console.log(
      `Contents of bucket '${argv.bucket}'${
        argv.prefix ? ` with prefix '${argv.prefix}'` : ""
      }:`
    );

    if (response.Contents && response.Contents.length > 0) {
      response.Contents.forEach((object, index) => {
        console.log(
          `${index + 1}. ${object.Key} (Size: ${formatBytes(
            object.Size || 0
          )}, Last Modified: ${object.LastModified})`
        );
      });
    } else {
      console.log("No objects found.");
    }
  } catch (error) {
    console.error("Error listing objects:", error);
    process.exit(1);
  }
}

/**
 * Upload a file to S3
 */
async function uploadFile(argv: any) {
  try {
    const filePath = argv.file;
    const key = argv.key || path.basename(filePath);
    const client = getS3Client(argv.region);

    const fileContent = readFileSync(filePath);

    const command = new PutObjectCommand({
      Bucket: argv.bucket,
      Key: key,
      Body: fileContent,
      ContentType: getContentType(filePath),
    });

    await client.send(command);
    console.log(
      `File '${filePath}' uploaded successfully to '${argv.bucket}/${key}'.`
    );
  } catch (error) {
    console.error("Error uploading file:", error);
    process.exit(1);
  }
}

/**
 * Download a file from S3
 */
async function downloadFile(argv: any) {
  try {
    const client = getS3Client(argv.region);
    const command = new GetObjectCommand({
      Bucket: argv.bucket,
      Key: argv.key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      throw new Error("Empty response body");
    }

    const outputPath = argv.output || path.basename(argv.key);
    const writeStream = createWriteStream(outputPath);

    await pipeline(response.Body as Readable, writeStream);

    console.log(`File downloaded successfully to '${outputPath}'.`);
  } catch (error) {
    console.error("Error downloading file:", error);
    process.exit(1);
  }
}

/**
 * Delete a file from S3
 */
async function deleteFile(argv: any) {
  try {
    const client = getS3Client(argv.region);
    const command = new DeleteObjectCommand({
      Bucket: argv.bucket,
      Key: argv.key,
    });

    await client.send(command);
    console.log(
      `File '${argv.key}' deleted successfully from bucket '${argv.bucket}'.`
    );
  } catch (error) {
    console.error("Error deleting file:", error);
    process.exit(1);
  }
}

/**
 * Format bytes to human-readable format
 */
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}

/**
 * Determine content type based on file extension
 */
function getContentType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();
  const contentTypes: Record<string, string> = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".txt": "text/plain",
    ".pdf": "application/pdf",
  };

  return contentTypes[ext] || "application/octet-stream";
}
