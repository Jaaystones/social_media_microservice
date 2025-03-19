# Social Media Microservices Platform

A scalable social media platform built with microservices architecture, focusing on high availability, fault tolerance, and performance.

## Architecture Overview

The platform consists of five independent microservices:

### 1. API Gateway (Port: 3000)
- Entry point for all client requests
- JWT-based authentication
- Request routing and proxy
- Rate limiting and security
- Services discovery and load balancing

### 2. User Service (Port: 3001)
- User authentication and authorization
- Account management
- Features:
  - User registration
  - Login/Logout
  - JWT token management
  - Refresh token mechanism
  - Password encryption (argon2)

### 3. Post Service (Port: 3002)
- Manages social media posts
- CRUD operations
- Event publishing for post activities
- Redis caching for improved performance

### 4. Media Service (Port: 3003)
- Handles media file uploads
- Cloud storage integration (Cloudinary)
- Media metadata management
- Supports multiple file formats
- Event-based media cleanup

### 5. Search Service (Port: 3004)
- Full-text search capabilities
- Real-time index updates
- Cached search results
- Event-based synchronization

## Technical Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Caching**: Redis
- **Message Broker**: RabbitMQ
- **Media Storage**: Cloudinary
- **Authentication**: JWT

### Common Features
- Distributed logging (Winston)
- Rate limiting
- CORS support
- Security headers (Helmet)
- Error handling
- Request validation (Joi)
- Event-driven architecture

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Redis
- RabbitMQ
- Cloudinary account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/social_media_microservice.git
cd social_media_microservice
```

2. Install RabbitMQ (Ubuntu):
```bash
chmod +x configure_rabbitmq.sh
./configure_rabbitmq.sh
```

3. Install dependencies for each service:
```bash
cd api && npm install
cd ../user-service && npm install
cd ../post-service && npm install
cd ../media-service && npm install
cd ../search-service && npm install
```

4. Configure environment variables:
Create `.env` files in each service directory with the following templates:

```env
# API Gateway
PORT=3000
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
USER_SERVICE_URL=http://localhost:3001
POST_SERVICE_URL=http://localhost:3002
MEDIA_SERVICE_URL=http://localhost:3003
SEARCH_SERVICE_URL=http://localhost:3004

# User Service
PORT=3001
MONGODB_URL=mongodb://localhost:27017/user_service
JWT_SECRET=your_jwt_secret
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost

# Post Service
PORT=3002
MONGODB_URL=mongodb://localhost:27017/post_service
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost

# Media Service
PORT=3003
MONGODB_URL=mongodb://localhost:27017/media_service
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
CLOUD_NAME=your_cloudinary_cloud_name
CLOUD_API_KEY=your_cloudinary_api_key
CLOUD_API_SECRET=your_cloudinary_api_secret

# Search Service
PORT=3004
MONGODB_URL=mongodb://localhost:27017/search_service
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost
```

5. Start the services:
```bash
# Start each service in separate terminals
cd api && npm run dev
cd user-service && npm run dev
cd post-service && npm run dev
cd media-service && npm run dev
cd search-service && npm run dev
```

## API Documentation

### Authentication Endpoints
- `POST /v1/auth/signup` - Register new user
- `POST /v1/auth/login` - User login
- `POST /v1/auth/refresh-token` - Refresh access token
- `POST /v1/auth/logout` - User logout

### Post Endpoints
- `POST /v1/posts/create-post` - Create new post
- `GET /v1/posts/all-posts` - Get all posts
- `GET /v1/posts/:id` - Get single post
- `DELETE /v1/posts/:id` - Delete post

### Media Endpoints
- `POST /v1/media/upload` - Upload media file
- `GET /v1/media` - Get all media files

### Search Endpoints
- `GET /v1/search/posts?query=searchterm` - Search posts

## Error Handling
The platform implements centralized error handling with:
- Structured error responses
- Error logging
- Rate limiting errors
- Authentication errors
- Validation errors

## Security Features
- JWT-based authentication
- Password hashing with Argon2
- Rate limiting
- Security headers
- CORS configuration
- Input validation

## Contributing
Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
