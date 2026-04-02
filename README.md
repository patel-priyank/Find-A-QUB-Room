# Find a QUB Room

This project is a campus navigation system consisting of a Node.js/Express backend API and a React web application frontend. It allows users to view campus locations and events, as well as provide feedback on locations.

## Project Structure

- `api/` - Node.js/Express backend API
  - `.env` - Environment variables for backend configuration (not committed; you must create this file)
  - `controllers/` - Route controllers for events, locations, statistics, and users
  - `middleware/` - Authentication middleware
  - `models/` - Mongoose models for MongoDB
  - `routes/` - Express route definitions
  - `server.js` - Main server entry point
- `webapp/` - React frontend application
  - `.env` - Environment variables for frontend configuration (not committed; you must create this file)
  - `index.html` - Main HTML entry point
  - `src/` - Source code for the frontend
    - `App.jsx` - Main React app component
    - `main.jsx` - React entry point (renders the app)
    - `index.css` - Global styles
    - `assets/` - Static assets (images, icons, etc.)
    - `components/` - React components
    - `contexts/` - React context providers
    - `hooks/` - Custom React hooks
    - `pages/` - Page components
    - `utils/` - Utility functions and constants

## Getting Started

### OSRM (Open Source Routing Machine)

This project uses [OSRM](https://project-osrm.org/) for routing and navigation features. Since the public demo server is not suitable for production or heavy use, you should run your own OSRM server locally or on a private server.

#### Running a Local OSRM Server with Docker

1. Download the required map data (e.g., from [Geofabrik](https://download.geofabrik.de/)), and place it in your working directory (e.g., `ireland-and-northern-ireland-latest.osm.pbf`).
2. Run the following commands in your map data directory:

   **Extract:**

   ```sh
   docker run --platform linux/amd64 -t -v $(pwd):/data osrm/osrm-backend \
      osrm-extract -p /opt/foot.lua /data/ireland-and-northern-ireland-latest.osm.pbf
   ```

   **Partition:**

   ```sh
   docker run --platform linux/amd64 -t -v $(pwd):/data osrm/osrm-backend \
      osrm-partition /data/ireland-and-northern-ireland-latest.osrm
   ```

   **Customise:**

   ```sh
   docker run --platform linux/amd64 -t -v $(pwd):/data osrm/osrm-backend \
      osrm-customize /data/ireland-and-northern-ireland-latest.osrm
   ```

   **Run:**

   ```sh
   docker run --platform linux/amd64 -t -i -p 3000:5000 -v $(pwd):/data osrm/osrm-backend \
      osrm-routed --algorithm mld /data/ireland-and-northern-ireland-latest.osrm
   ```

3. Update your frontend configuration to use your local OSRM server endpoint (e.g., `http://localhost:3000`).

Refer to the [OSRM documentation](https://github.com/Project-OSRM/osrm-backend) for more details.

### Prerequisites

- Node.js (v16 or higher recommended; includes npm)
- MongoDB (for backend)
- Docker (for running the OSRM server)
- MapTiler API key (for frontend maps)

#### Installing Docker

If you do not have Docker installed, follow the instructions for your operating system at the official Docker documentation: [Get Docker](https://docs.docker.com/get-docker/)

### Service Setup

#### MongoDB

Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) or use your own MongoDB server. Obtain your connection string (URI) and set it in your `.env` file as `MONGO_URI`.

#### Cloudinary (for image uploads)

Create a free account at [Cloudinary](https://cloudinary.com/). Get your Cloudinary API credentials and set them in your `.env` file (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`).

#### MapTiler (for map tiles)

Create a free account at [MapTiler](https://www.maptiler.com/) and obtain an API key. Set it in your `.env` file as `VITE_MAPTILER_API_KEY`.

### Backend Setup (`api/`)

1. Install dependencies:

   ```sh
   cd api
   npm install
   ```

2. Copy the example environment file and update values as needed:

   ```sh
   cp .env.example .env
   # Edit .env to set JWT_SECRET, MONGO_URI, CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.
   ```

3. Start the server:

   ```sh
   npx nodemon
   ```

   Or, to start in production mode:

   ```sh
   npm start
   ```

### Frontend Setup (`webapp/`)

1. Install dependencies:

   ```sh
   cd webapp
   npm install
   ```

2. Copy the example environment file and update values as needed:

   ```sh
   cp .env.example .env
   # Edit .env to set VITE_MAPTILER_API_KEY.
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

   Or, to build for production and preview locally:

   ```sh
   npm run build
   npm run preview
   ```

## License

This project is for educational purposes only as part of an MSc Software Development dissertation at Queen's University Belfast.
