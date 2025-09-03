
# Stock-Smith

A comprehensive stock market analysis and portfolio management application.

## Table of Contents

- [About The Project](#about-the-project)
- [Features](#features)
- [Architecture](#architecture)
- [Installation](#installation)
- [Running the Application](#running-the-application)
- [Authors](#authors)
- [License](#license)

## About The Project

Stock-Smith is a full-stack web application designed to provide users with a powerful tool for tracking the stock market, managing their investment portfolios, and staying up-to-date with the latest financial news. The project is built with a microservices architecture for the backend and a modern React frontend.

## Features

- **Real-time Stock Data:** Get live updates on stock prices and market trends.
- **Portfolio Management:** Track your investments, view your portfolio's performance, and analyze your assets.
- **Stock News and Analysis:** Access the latest news and articles related to the stock market and specific companies.
- **User Authentication:** Secure user accounts for personalized portfolio management.
- **Stock Prediction:** Utilizes a machine learning model to provide future stock price predictions.
- **Market Dashboard:** A comprehensive overview of the market's performance.

## Architecture

A detailed explanation of the project architecture can be found in the [Architecture document](./docs/architecture.md).

## Installation

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- [Docker](https://www.docker.com/products/docker-desktop)
- [Docker Compose](https://docs.docker.com/compose/install/)

### Frontend

1.  Navigate to the `frontend1` directory:
    ```sh
    cd frontend1
    ```
2.  Install NPM packages:
    ```sh
    npm install
    ```

### Backend

The backend services are containerized using Docker.

1.  Navigate to the `server` directory:
    ```sh
    cd server
    ```
2.  Build and start the services:
    ```sh
    docker-compose up -d --build
    ```

## Running the Application

### Frontend

1.  Navigate to the `frontend1` directory:
    ```sh
    cd frontend1
    ```
2.  Run the development server:
    ```sh
    npm run dev
    ```
3.  Open your browser and go to `http://localhost:5173` (or the address shown in your terminal).

### Backend

The backend services will be running after executing the `docker-compose up` command. The services are:

-   **AuthenticationService:** Handles user registration and login.
-   **MarketService:** Provides stock market data.
-   **NewsService:** Delivers financial news.
-   **PaymentService:** Manages payments and subscriptions.
-   **PredictionService:** Provides stock price predictions.
-   **UserService:** Manages user profiles and data.

The services are exposed through an Nginx gateway.

## Authors

-   **Animesh** - *Backend* - [Animesh-X](https://github.com/Animesh-X)
-   **Aryan** - *Machine Learning* - [Aryan-Choudhari](https://github.com/Aryan-Choudhari)
-   **Ayush** - *Frontend* - [Ayush583-Aswal](https://github.com/Ayush583-Aswal)
-   **Nitin** - *Frontend* - [Gitstar12345](https://github.com/Gitstar12345)

## License

This project is licensed under the MIT License - see the `LICENSE.md` file for details.
