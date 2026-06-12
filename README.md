# Smart Conference Room Booking System (Internal Enterprise SaaS)

A modern, full-stack, enterprise-grade Conference Room Booking System featuring role-based access portals (Employee, Manager, Facility Admin, Super Admin), an AI booking assistant, conflict resolution engine, a QR check-in simulator, and visual utilization analytics.

---

## 🛠️ Required Software & Versions

To build and run this application, make sure you have the following versions installed on your system (these match your local configuration):

*   **Java Development Kit (JDK)**: Version **21** (LTS)
*   **Apache Maven**: Version **3.9.9**
*   **Node.js**: Version **v24.8.0**
*   **npm (Node Package Manager)**: Version **11.6.0**
*   **Web Browser**: Chrome, Edge, Firefox, or Safari (with HTML5 Canvas/SVG support)
*   **IDE**: Eclipse IDE (version 2023-09 or newer recommended for Java 21 compatibility), IntelliJ IDEA, or VS Code.

---

## 💾 Database Layer: SQLite3

Initially, the application is designed to store data in **SQLite3** for lightweight, zero-configuration local deployment.
*   **Database File**: `meetingroom.db` (auto-created in the `backend/` directory upon backend startup).
*   **Dialect**: Hibernate 6 native SQLite Dialect (`org.hibernate.community.dialect.SQLiteDialect`).
*   **Future Enterprise Scalability**: The database access layer is fully abstracted using **Spring Data JPA & Hibernate**. To migrate to **Microsoft SQL Server** or **MySQL** in the future, you only need to change the connection URL, driver dependency, and dialect in `application.yml` without modifying any Java entity class.

---

## 🚀 Step-by-Step Installation & Setup

Clone the repository if you haven't already:
```bash
git clone https://github.com/trstevenz/conferencebook.git
cd conferencebook
```

---

## ☕ How to Setup and Run the Backend (Java Spring Boot)

### Option A: Import and Run in Eclipse IDE (Recommended)
1.  **Open Eclipse IDE**.
2.  Go to the top menu and select **File** > **Import...**
3.  In the Import dialog, expand the **Maven** folder and select **Existing Maven Projects**, then click **Next**.
4.  Click **Browse** next to the Root Directory field and navigate to your cloned repository, selecting the **`backend/`** folder (e.g., `D:\Projects\Meeting Booking\backend`).
5.  Eclipse will scan the folder and check the checkbox next to `/pom.xml com.enterprise:meetingroom:0.0.1-SNAPSHOT [jar]`. Click **Finish**.
6.  *Wait for Eclipse to download dependencies and build the workspace.*
7.  Once imported, expand the project in the **Package Explorer**, navigate to `src/main/java`, and open the package `com.enterprise.meetingroom`.
8.  Right-click **`MeetingRoomApplication.java`** and select **Run As** > **Java Application** (or **Spring Boot App** if you have the Spring Tool Suite plugin).
9.  The console window will show the Spring Boot logo, create the local `meetingroom.db` SQLite file, seed test data, and run on port **`8080`**.

### Option B: Run in the Terminal
1.  Open your command line and navigate to the `backend/` directory:
    ```bash
    cd backend
    ```
2.  Build and run the Spring Boot application using Maven:
    ```bash
    mvn spring-boot:run
    ```
3.  The backend server will launch and listen for API calls at `http://localhost:8080`.

---

## ⚛️ How to Setup and Run the Frontend (React + TypeScript)

1.  Open your command line and navigate to the `frontend/` directory:
    ```bash
    cd frontend
    ```
2.  Install all node modules and dependencies:
    ```bash
    npm install
    ```
3.  Start the Vite development web server:
    ```bash
    npm run dev
    ```
4.  Open your web browser and navigate to the URL displayed in the console (usually **`http://localhost:5173`**).

---

## 🔑 Default Seeded Accounts & Credentials

To facilitate testing of role-based portals, the database is auto-seeded with four default users upon startup. Use the credentials below to log in:

| User Role | Username | Password | Access Rights |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `password123` | User directories, system settings configuration, system security audit logs. |
| **Facility Admin** | `admin` | `password123` | Room creation/modification, amenity listings, maintenance block calendar scheduler. |
| **Manager** | `manager` | `password123` | All employee permissions, team reservations calendar, override pending approval bookings. |
| **Employee** | `employee` | `password123` | Search rooms by capacity/amenities, schedule bookings, cancel/edit own bookings, AI Chat. |

---

## 🤖 Guide to Core Features

### 1. AI Chat Assistant (Room Finder & Summary)
*   **Conversational Booking**: Click the floating **Bot icon** in the bottom-right corner. Type queries like:
    *   *"What rooms are free now?"*
    *   *"I need a room for 10 people tomorrow at 3 PM"*
    *   *AI will check overlaps, candidate capacities, propose a room slot, and show a "Confirm Booking" button directly in the chat!*
*   **Conflict Recommendations**: If a slot is busy, the AI resolves conflicts by listing alternative free rooms or showing free hours later in the day.
*   **Meeting Summarizer**: Go to the **AI Summarizer** tab, paste a raw huddle transcript, and click "Extract Key Summary" to generate a markdown output with action items, speakers list, and key decisions.

### 2. QR Check-In Scanner Simulation
1.  Log in as **`employee`** and schedule a booking.
2.  Wait for it to be approved (or auto-approved).
3.  Go to the **QR Check-In** tab. You'll see a generated QR code for your room reservation.
4.  Click **Simulate QR Scan** to verify check-in and mark attendance.
5.  *Rule*: If a meeting starts and no check-in scan occurs within **15 minutes** (timeout limit configured in `application.yml`), the background scheduler running on the Spring Boot server will automatically release the room, mark it as `NO_SHOW`, and send a notification alert to the user.

### 3. Manager Approval Override
1.  Log in as **`employee`** and create a booking in a restricted room (rooms containing "Boardroom" or "Restricted" in their name require approval).
2.  The booking will be created in the **PENDING** state.
3.  Log in as **`manager`** and navigate to **Team Bookings**.
4.  You will see the pending request. Click **Approve** or **Reject** to perform the manager override workflow.

### 4. Interactive Timeline Calendar
*   Click **Bookings Calendar** to view a visual time-block grid.
*   Rooms are listed vertically, and hours (8 AM - 6 PM) are horizontal.
*   Click on any empty cell to automatically launch the scheduling modal pre-filled with that room and hour!
