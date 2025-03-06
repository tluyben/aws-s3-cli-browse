# 🪣 AWS S3 CLI Tool

A powerful, easy-to-use command-line interface for managing your AWS S3 buckets and objects using TypeScript and Node.js.

## ✨ Features

- 📋 List all your S3 buckets across regions
- 🆕 Create new buckets with region specification
- 🗑️ Delete existing buckets
- 📂 List files within buckets (with optional prefix filtering)
- ⬆️ Upload files to your buckets
- ⬇️ Download files from your buckets
- ❌ Delete files from your buckets
- 🔐 Secure credential management via environment variables or .env files

## 🚀 Installation

### Prerequisites

- Node.js (v14 or newer)
- npm or yarn
- AWS account with access key and secret key

### Setup

1. Clone this repository:

   ```bash
   git clone https://github.com/yourusername/aws-s3-cli.git
   cd aws-s3-cli
   ```

2. Install dependencies:

   ```bash
   npm install
   # or
   yarn install
   ```

3. Compile the TypeScript code:

   ```bash
   npm run build
   ```

4. Make the script executable (Linux/macOS):
   ```bash
   chmod +x dist/aws-s3-cli.js
   ```

## 🔑 Authentication

You can provide AWS credentials in several ways:

### 1. Environment Variables

```bash
export AWS_ACCESS_KEY_ID="your-access-key"
export AWS_SECRET_ACCESS_KEY="your-secret-key"
```

### 2. .env File

Create a `.env` file in the project root:

```
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

You can also specify a custom .env file path:

```bash
./aws-s3-cli.js --env-file /path/to/custom.env <command>
```

### 3. AWS Credentials File

The tool will automatically use credentials from `~/.aws/credentials` if available.

## 🛠️ Usage Examples

### Help Information

```bash
./aws-s3-cli.js --help
```

### List All Buckets

```bash
./aws-s3-cli.js list-buckets --region us-east-1
```

### Create a New Bucket

```bash
./aws-s3-cli.js create-bucket --name my-awesome-bucket --region us-west-2
```

### Delete a Bucket

```bash
./aws-s3-cli.js delete-bucket --name bucket-to-remove --region us-east-1
```

### List Files in a Bucket

```bash
./aws-s3-cli.js list-files --bucket my-bucket --region us-east-1
```

With prefix filtering:

```bash
./aws-s3-cli.js list-files --bucket my-bucket --prefix images/ --region us-east-1
```

### Upload a File

```bash
./aws-s3-cli.js upload-file --bucket my-bucket --file ./path/to/local/file.jpg --key remote/path/file.jpg
```

### Download a File

```bash
./aws-s3-cli.js download-file --bucket my-bucket --key remote/path/file.jpg --output ./local/path/downloaded.jpg
```

### Delete a File

```bash
./aws-s3-cli.js delete-file --bucket my-bucket --key remote/path/file.jpg
```

## 📋 Available Commands

| Command         | Description             | Required Parameters  | Optional Parameters    |
| --------------- | ----------------------- | -------------------- | ---------------------- |
| `list-buckets`  | List all S3 buckets     | -                    | `--region`             |
| `create-bucket` | Create a new bucket     | `--name`             | `--region`             |
| `delete-bucket` | Delete a bucket         | `--name`             | `--region`             |
| `list-files`    | List files in a bucket  | `--bucket`           | `--region`, `--prefix` |
| `upload-file`   | Upload a file to S3     | `--bucket`, `--file` | `--region`, `--key`    |
| `download-file` | Download a file from S3 | `--bucket`, `--key`  | `--region`, `--output` |
| `delete-file`   | Delete a file from S3   | `--bucket`, `--key`  | `--region`             |

## 📁 Project Structure

```
aws-s3-cli/
├── src/
│   └── aws-s3-cli.ts      # Main TypeScript source file
├── dist/                  # Compiled JavaScript files
├── .env                   # Environment variables (git-ignored)
├── .env.example           # Example environment file
├── .gitignore             # Git ignore file
├── package.json           # Node.js package configuration
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## ⚙️ Configuration

You can create a `tsconfig.json` file for your TypeScript configuration:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
```

## 📦 Dependencies

- `@aws-sdk/client-s3`: AWS SDK for S3 operations
- `@aws-sdk/credential-providers`: AWS credential providers
- `dotenv`: Environment variable management
- `yargs`: Command-line argument parsing

## 🧠 Advanced Usage

### Working with Large Files

The tool handles streaming for file uploads and downloads, making it efficient for large files.

### Error Handling

All commands include proper error handling with helpful error messages.

### Content Type Detection

When uploading files, the tool automatically detects the content type based on file extension.

## 🔒 Security Best Practices

- Never commit your `.env` file or AWS credentials to version control
- Consider using AWS IAM roles with limited permissions
- Regularly rotate your access keys
- Use the principle of least privilege when configuring access

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgements

- [AWS SDK for JavaScript](https://aws.amazon.com/sdk-for-javascript/)
- [Node.js](https://nodejs.org/)
- [TypeScript](https://www.typescriptlang.org/)
