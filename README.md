# Chat App RN

## 📹 Demo

Puedes ver una demostración de la funcionalidad de la aplicación en el siguiente video:

[https://youtu.be/LcIah3_qzkA](https://youtu.be/LcIah3_qzkA)

---

## Español

Esta es una aplicación de chat en tiempo real desarrollada con React Native y Expo.

### Descripción

Una aplicación de mensajería móvil que permite a los usuarios registrarse, buscar a otros por su correo electrónico e iniciar conversaciones en tiempo real. La comunicación es instantánea gracias al uso de WebSockets, y la autenticación se gestiona de forma segura con JWT.

### Características

*   **Autenticación de Usuarios:** Sistema de autenticación seguro mediante JSON Web Tokens (JWT).
*   **Búsqueda de Usuarios:** Encuentra y contacta a otros usuarios buscando su dirección de correo electrónico.
*   **Chat en Tiempo Real:** Conversaciones fluidas y en tiempo real gracias a la implementación de WebSockets.
*   **Historial de Chat:** Todas las conversaciones se guardan de forma persistente en una base de datos PostgreSQL.

### Arquitectura y Tecnologías

#### Frontend (React Native)

La aplicación móvil está construida con **React Native** y **Expo**, permitiendo un desarrollo rápido y multiplataforma (iOS y Android).

*   **Enrutamiento:** Se utiliza **Expo Router** para gestionar la navegación de la aplicación de forma declarativa y basada en el sistema de archivos.
*   **Lenguaje:** El código está escrito en **TypeScript** para garantizar un desarrollo robusto y escalable.
*   **Gestor de Paquetes:** Se usa **Bun** para una gestión de dependencias rápida y eficiente.
*   **Builds y Despliegue:** **Expo Application Services (EAS)** se utiliza para construir y distribuir la aplicación.
*   **Gestión de Estado:** La aplicación maneja el estado global a través de stores dedicados para la autenticación, los chats y la conexión WebSocket.

#### Backend

El backend está desarrollado con **FastAPI**, un moderno y rápido framework de Python, que gestiona la lógica de negocio, la autenticación y la comunicación en tiempo real. La persistencia de datos se realiza en una base de datos **PostgreSQL**.

---

## English

This is a real-time chat application developed with React Native and Expo.

### Description

A mobile messaging application that allows users to register, search for others by their email, and start real-time conversations. Communication is instant thanks to the use of WebSockets, and authentication is securely managed with JWT.

### Features

*   **User Authentication:** Secure authentication system using JSON Web Tokens (JWT).
*   **User Search:** Find and contact other users by searching for their email address.
*   **Real-Time Chat:** Smooth, real-time conversations thanks to the implementation of WebSockets.
*   **Chat History:** All conversations are persistently stored in a PostgreSQL database.

### Architecture and Technologies

#### Frontend (React Native)

The mobile application is built with **React Native** and **Expo**, enabling rapid, cross-platform development (iOS and Android).

*   **Routing:** **Expo Router** is used to manage application navigation declaratively and based on the file system.
*   **Language:** The code is written in **TypeScript** to ensure robust and scalable development.
*   **Package Manager:** **Bun** is used for fast and efficient dependency management.
*   **Builds and Deployment:** **Expo Application Services (EAS)** is used to build and distribute the application.
*   **State Management:** The application handles global state through dedicated stores for authentication, chats, and the WebSocket connection.

#### Backend

The backend is developed with **FastAPI**, a modern and fast Python framework, which manages business logic, authentication, and real-time communication. Data persistence is handled by a **PostgreSQL** database.
