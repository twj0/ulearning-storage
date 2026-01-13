
# Ulearning Cloud Drive

[中文](./README-zhCN.md) | **English**

A free personal cloud drive built utilizing the Huawei Cloud OBS storage space provided by the Ulearning platform. It supports file uploads and functions as an image hosting service.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS
- **Deployment**: Vercel (Free Serverless Functions + Static Hosting)
- **Storage**: Huawei Cloud OBS (via Ulearning platform)
- **Authentication**: Ulearning Account Login

## Quick Deployment

### 1. Fork the Project
[![Fork on GitHub](https://img.shields.io/badge/Fork-GitHub-blue?style=for-the-badge&logo=github)](https://github.com/twj0/ulearning-storage/fork)

### 2. Deploy to Vercel
1. Visit [vercel.com](https://vercel.com) and log in.
2. Click **Add New...** → **Project**.
3. Select the repository you just forked and click **Deploy**.

### 3. Configure Environment Variables
Add the following variables in your Vercel project settings:
```env
ULEARNING_USERNAME=your_ulearning_email
ULEARNING_PASSWORD=your_ulearning_password
COURSE_IDS=153836,123456
COURSE_PASSWORDS={"153836":"pass_for_cs","123456":"pass_for_python"}
IMG_BED_FOLDER_NAME=图床
ADMIN_PASSWORD=password
```

### Done!
Visit the generated URL to start using your cloud drive.

## How It Works

```
User → Vercel Frontend → Vercel Functions API → Ulearning API → Huawei Cloud OBS
```

1. **Login**: Obtains an access token via the Ulearning API.
2. **Upload**: Uses the token to call the Ulearning OBS upload interface.
3. **Storage**: Files are stored directly in Huawei Cloud OBS.
4. **Access**: Files are accessed via links provided by Ulearning.

## Development

### Local Setup
```bash
npm install
cp .env.example .env  # Configure your Ulearning credentials
npm run dev           # Start the development server
```

### Project Structure
```
api/                     # Serverless Functions
├── lib/auth.js         # Shared authentication module
├── login.js            # Login interface
├── upload.js           # File upload handling
├── ulearning-api.js    # Ulearning API client
└── obs-uploader.js     # OBS upload logic

src/                     # React Frontend
├── components/         # UI Components
├── App.tsx            # Main Application
└── main.tsx           # Entry point
```

### Key Technical Points
- Uses Vercel Functions to handle API requests.
- Retrieves OBS upload credentials via the Ulearning API.
- Frontend uses React Dropzone for drag-and-drop uploads.
- Supports direct image links and file downloads.

## Costs & Limits

- **Vercel**: Free Plan (100k requests/day, 100GB bandwidth).
- **Storage**: Ulearning OBS (Free, max 1GB per single file).
- **Domain**: Supports custom domain binding.

Suitable for personal cloud storage, image hosting, and small team file sharing.

## ⚠️ Disclaimer

> [!IMPORTANT]
> **Solemn Declaration**: This project is intended for **technical research and educational purposes only**. It is a third-party open-source tool developed based on the analysis of the Ulearning web interface. It is **NOT an official product** of Ulearning or Huawei Cloud. This project has no affiliation with Ulearning official. The developer provides no guarantees of any kind.

1. **Educational Use Only**:
   This project is aimed solely at technical research and programming learning. Users must comply with local laws, regulations, and the Ulearning platform's user agreement. Do not use this project for commercial purposes or to obtain illegal benefits.
   - It is strictly prohibited to store pornographic, violent, politically sensitive, or other violating content.
   - It is strictly prohibited to abuse the API for high-frequency requests or large-scale traffic distribution.

2. **Use at Your Own Risk**:
   This project utilizes the free OBS storage space of the Ulearning platform.
   - **No Data Guarantee**: The developer cannot guarantee the stability or persistence of the storage service. Please do not store important private data.
   - **Risk of Account Ban**: Abnormal large-scale traffic or storage behavior may result in your Ulearning account being banned by the platform. Any resulting losses are your own responsibility.
   
   The user assumes all consequences arising from the use of this project (including but not limited to account bans, data loss, legal disputes, etc.). The developer assumes no responsibility.

3. **Third-Party Rights**: The interfaces and storage services involved in this project belong to **Ulearning** and **Huawei Cloud**. Please abide by the terms of service of the relevant platforms.

4. **Immediate Cessation**: If you are a relevant stakeholder and believe that this project infringes upon your rights, please contact the author for deletion. Users should also stop using it immediately. To the extent permitted by law, the developer is not liable for any direct or indirect losses (including but not limited to loss of profits, data loss, business interruption) caused by the use of this project.

5. **Intellectual Property**:
   The intellectual property rights of the third-party services (Ulearning, Huawei Cloud) referenced in this project belong to their respective original companies.

**Downloading or using this project is deemed as your agreement to the above terms.**
