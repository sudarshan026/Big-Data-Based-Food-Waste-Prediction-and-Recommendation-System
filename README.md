# FoodWaste Analytics
## Big Data-Based Food Waste Prediction and Recommendation System for College Canteens

[![SDG 12](https://img.shields.io/badge/SDG%2012-Responsible%20Consumption%20%26%20Production-16a34a?style=for-the-badge&logo=un-sustainable-development-goals)](https://sdgs.un.org/goals/goal12)
[![SDG 2](https://img.shields.io/badge/SDG%202-Zero%20Hunger-eab308?style=for-the-badge&logo=un-sustainable-development-goals)](https://sdgs.un.org/goals/goal2)
[![Apache Spark](https://img.shields.io/badge/Apache%20PySpark-4.3-E25A1C?style=for-the-badge&logo=apache-spark&logoColor=white)](https://spark.apache.org/)
[![Scikit-Learn](https://img.shields.io/badge/Scikit--Learn-Random%20Forest-F7931E?style=for-the-badge&logo=scikit-learn&logoColor=white)](https://scikit-learn.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Flask](https://img.shields.io/badge/Flask-3.1-000000?style=for-the-badge&logo=flask&logoColor=white)](https://flask.palletsprojects.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**FoodWaste Analytics** is an end-to-end, full-stack microproject developed for the curriculum subject **Big Data and Social Media Analytics (BDSMA)**.

The system empowers campus food services, college canteens, and institutional mess facilities to track daily food preparation and consumption, identify systemic waste patterns across categories and meal periods, forecast upcoming demand using Machine Learning, and execute a **5-stage distributed PySpark Big Data processing pipeline** over historical datasets containing **10,000+ service records**.

---

## 1. Project Objectives & SDG Alignment

1. **Daily Operational Tracking:** Monitor food preparation, student consumption, and discarded quantities across 8 food categories and 4 daily meal periods (Breakfast, Lunch, Evening Snacks, Dinner).
2. **Distributed Big Data Engineering:** Implement a native Apache PySpark pipeline performing ingestion, schema validation, duplicate purging, missing value imputation, multi-column feature transformations, and distributed aggregations.
3. **Machine Learning Demand Forecasting:** Train a Scikit-learn `RandomForestRegressor` on historical attendance, menu item popularity, day of the week, and calendar seasonality ($R^2 = 0.983$).
4. **Food Preparation Optimization Engine:** Compute recommended food preparation batches using predicted demand combined with an adjustable **Safety Buffer (default 10%)** to prevent stockouts while reducing excess surplus.
5. **Financial Loss Auditing:** Calculate granular financial losses per item and category in Indian Rupees (₹), translating sustainability metrics directly into operational cost savings.
6. **Executive Reporting:** Provide downloadable comma-separated values (CSV) datasets and publication-quality PDF audit reports generated with ReportLab.

### United Nations Sustainable Development Goals (SDGs)
- **Primary: SDG 12 – Responsible Consumption and Production**  
  *Target 12.3:* Halve per capita food waste at retail and consumer levels and reduce food loss across production chains.
- **Secondary: SDG 2 – Zero Hunger**  
  *Target 2.1 & 2.4:* Ensure sustainable food production and optimize kitchen yields to eliminate food waste.

---

## 2. Technology Stack & Frameworks

| Tier | Technology | Purpose |
|---|---|---|
| **Frontend UI** | **React 18.3** (Vite 6) | High-performance single page application (SPA) |
| **Styling** | **Tailwind CSS 3.4** | Clean sustainability theme (white/emerald green `#16a34a`) |
| **Charts** | **Recharts 2.13** | Grouped Bar Charts, Line Charts, Donut Charts, Area Charts |
| **Icons** | **Lucide React** | Modern iconography across sidebar, cards, and buttons |
| **Routing** | **React Router DOM 6.28** | Multi-page client-side navigation |
| **HTTP Client** | **Axios 1.7** | REST API communication with structured endpoints |
| **Backend REST API** | **Python 3 Flask 3.1** | Modular Blueprint REST server with CORS |
| **Database & ORM** | **SQLite & SQLAlchemy 2.0** | Relational storage for 10,749+ records |
| **Big Data Engine** | **Apache PySpark 4.3** | Distributed DataFrame transformations, aggregations, windowing |
| **Machine Learning** | **Scikit-learn 1.8** | Random Forest Regressor, LabelEncoder, train-test evaluation |
| **Serialization** | **Joblib 1.5** | Model persistence (`demand_predictor.joblib`, `model_meta.joblib`) |
| **PDF Generation** | **ReportLab 5.0** | Professional PDF analytical reports with tables & styling |

---

## 3. System Architecture & Distributed Pipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       React 18 / Tailwind Dashboard                         │
│  [Overview]   [Analytics]   [Prediction]   [Recommendations]   [Records]    │
│  [Big Data Processing (PySpark)]           [Reports (PDF / CSV Export)]     │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │ HTTP REST APIs (JSON / Streaming Blobs)
┌──────────────────────────────────────▼──────────────────────────────────────┐
│                            Flask 3 REST Server                              │
│       Routes: /dashboard, /food-records, /analytics, /predict, /spark       │
└──────────────────────┬───────────────────────────────┬──────────────────────┘
                       │                               │
┌──────────────────────▼───────┐       ┌───────────────▼──────────────────────┐
│     SQLite Relational DB     │       │    Apache PySpark 4.3 Engine         │
│   (food_waste_records table) │       │    (Distributed local[*] Master)     │
└──────────────────────────────┘       └───────────────┬──────────────────────┘
                                                       │
         ┌─────────────────────────────────────────────┴────────────────────────────────────────┐
         │ 1. Ingestion: SparkSession loads 10,749 CSV records with inferred schema             │
         │ 2. Cleaning: dropDuplicates(non_id), fillna(medians), validate non-negative bounds   │
         │ 3. Transform: withColumn(waste%, consumption%, total_cost, financial_loss, month)    │
         │ 4. Aggregations: distributed groupBy across category, meal, food item, and date      │
         │ 5. Output: Writes processed_food_waste.csv and 5 JSON data marts to data/aggregated/ │
         └──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 4. PySpark Big Data Processing Pipeline In-Depth

The core requirement of the BDSMA microproject is executing distributed data transformations on large datasets rather than relying solely on static in-memory aggregations:

### Stage 1: Data Ingestion
- `spark.read.csv('data/raw/food_waste_data.csv', header=True, inferSchema=True)`
- Ingests **10,749 rows** spanning 365 days of canteen operations.
- Automatically infers numerical, string, and date data types.

### Stage 2: Distributed Data Cleaning
- **Duplicate Removal:** Purges non-unique entries using `df.dropDuplicates([cols_without_id])` (removed 106 duplicates).
- **Missing Value Imputation:**
  - `students_served` missing values imputed using median attendance.
  - `cost_per_kg` missing values imputed using category mean prices.
  - `special_event` boolean flags normalized to `False` where null.
- **Integrity Constraints:** Filters out erroneous records where $\text{quantity\_prepared} \le 0$ or $\text{quantity\_consumed} > \text{quantity\_prepared}$.
- **Cleaned Dataset:** Yields **10,643 verified records**.

### Stage 3: DataFrame Feature Transformations
Transforms the DataFrame by computing derived features with PySpark SQL functions (`F.col`, `F.round`, `F.to_date`, `F.date_format`):
- $\text{quantity\_wasted} = \text{quantity\_prepared} - \text{quantity\_consumed}$
- $\text{waste\_percentage} = \frac{\text{quantity\_wasted}}{\text{quantity\_prepared}} \times 100$
- $\text{consumption\_percentage} = \frac{\text{quantity\_consumed}}{\text{quantity\_prepared}} \times 100$
- $\text{total\_cost} = \text{quantity\_prepared} \times \text{cost\_per\_kg}$
- $\text{financial\_loss} = \text{quantity\_wasted} \times \text{cost\_per\_kg}$
- Temporal partitioning: `date_parsed`, `month`, `year`.

### Stage 4: Distributed Aggregations & Analysis
Executes distributed `groupBy()` and `agg()` operations:
1. `category_waste`: `groupBy('food_category').agg(...)` &rarr; Totals and waste percentages for 8 categories.
2. `meal_waste`: `groupBy('meal_type').agg(...)` &rarr; Wastage across Breakfast, Lunch, Snacks, Dinner.
3. `top_wasted_items`: `groupBy('food_item', 'food_category').agg(...).orderBy(desc).limit(10)` &rarr; Ranked highest wastage items.
4. `monthly_trends`: `groupBy('month').agg(...).orderBy('month')` &rarr; Month-by-month historical progression.
5. `financial_loss`: Monetary loss totals per category.

### Stage 5: Output Storage
- Cleaned DataFrame exported to `data/processed/processed_food_waste.csv`.
- Aggregation results exported to dedicated JSON data marts in `data/aggregated/`.
- Execution summary saved to `data/spark_status.json`.

---

## 5. Machine Learning Methodology

### Feature Selection (Zero Data Leakage)
To prevent data leakage, the model utilizes **only inputs available before cooking begins**:

| Feature Name | Type | Description |
|---|---|---|
| `food_item_encoded` | Categorical (Integer) | LabelEncoded food item (e.g. Plain Rice, Dal Tadka) |
| `food_category_encoded` | Categorical (Integer) | LabelEncoded food category (Rice, Curry, Bread, etc.) |
| `meal_type_encoded` | Categorical (Integer) | Breakfast, Lunch, Evening Snacks, or Dinner |
| `day_of_week_encoded` | Categorical (Integer) | Monday through Sunday variation |
| `month` | Numerical (1–12) | Seasonal calendar factor |
| `special_event_int` | Binary (0 or 1) | College fest, conference, or high-footfall day |
| `quantity_prepared` | Numerical (Float, kg) | Planned baseline quantity to prepare |

**Target Variable:** `quantity_consumed` (Actual kilograms consumed by students).

### Algorithm & Hyperparameters
- **Algorithm:** `sklearn.ensemble.RandomForestRegressor`
- `n_estimators = 100`
- `max_depth = 15`
- `random_state = 42`
- `n_jobs = -1` (Multi-core parallel training)

### Verified Model Performance (10,749 Samples, 80/20 Train-Test Split)
- **Coefficient of Determination ($R^2$):** **0.983** (98.3% variance explained)
- **Mean Absolute Error (MAE):** **0.701 kg**
- **Root Mean Squared Error (RMSE):** **1.123 kg**

### Food Preparation Recommendation Formula
$$\text{Predicted Consumption} = \mathcal{M}_{\text{RandomForest}}(\vec{x})$$
$$\text{Recommended Preparation} = \text{Predicted Consumption} \times \left(1 + \frac{\text{Safety Buffer \%}}{100}\right)$$
$$\text{Potential Waste Reduction} = \max\left(0, \text{Planned Preparation} - \text{Recommended Preparation}\right)$$

*Example:* If predicted consumption is $42.5\text{ kg}$ and a $10\%$ safety buffer is configured, the system recommends preparing $46.75\text{ kg}$. If the canteen had planned to prepare $55\text{ kg}$, the system identifies a potential reduction of $8.25\text{ kg}$ of wasted food.

---

## 6. Database Schema (`food_waste_records`)

Stored in `backend/instance/foodwaste.db` (SQLite):

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `INTEGER` | PRIMARY KEY, AUTOINCREMENT | Unique record ID |
| `date` | `DATE` | NOT NULL | Date of meal service |
| `food_item` | `VARCHAR(100)` | NOT NULL | Item name (e.g. Biryani, Chapati) |
| `food_category` | `VARCHAR(50)` | NOT NULL | Category (Rice, Curry, Bread, etc.) |
| `meal_type` | `VARCHAR(30)` | NOT NULL | Breakfast, Lunch, Snacks, Dinner |
| `quantity_prepared` | `FLOAT` | NOT NULL, > 0 | Total food cooked (kg) |
| `quantity_consumed` | `FLOAT` | NOT NULL, $\ge 0$ | Total food eaten (kg) |
| `quantity_wasted` | `FLOAT` | NOT NULL, $\ge 0$ | Discarded food (kg) |
| `students_served` | `INTEGER` | NULLABLE | Number of student patrons |
| `cost_per_kg` | `FLOAT` | DEFAULT 0 | Preparation cost per kg (₹) |
| `day_of_week` | `VARCHAR(15)` | NULLABLE | Name of weekday |
| `special_event` | `BOOLEAN` | DEFAULT FALSE | Campus event flag |
| `remarks` | `VARCHAR(500)` | NULLABLE | Operational notes |
| `created_at` | `DATETIME` | DEFAULT UTC | Record creation timestamp |

---

## 7. REST API Endpoints Reference

All endpoints return structured JSON with proper HTTP status codes (`200 OK`, `201 Created`, `400 Bad Request`, `404 Not Found`, `500 Internal Error`).

### Dashboard & Analytics
- `GET /api/dashboard?period=all|90days|30days|7days|today|custom` &rarr; Key performance indicators, financial losses, and 6 chart series.
- `GET /api/analytics/waste` &rarr; Overall waste percentage, average daily waste, high-waste days.
- `GET /api/analytics/category` &rarr; Prepared, consumed, wasted, and loss grouped by category.
- `GET /api/analytics/meal` &rarr; Waste metrics by meal period.
- `GET /api/analytics/trends` &rarr; Daily timeline, weekly day-of-week patterns, and monthly trends.

### Record Management (CRUD)
- `GET /api/food-records?page=1&per_page=15&search=&category=&meal_type=` &rarr; Paginated records list with search.
- `POST /api/food-records` &rarr; Create new record (validates `consumed <= prepared`, auto-calculates wasted).
- `GET /api/food-records/<id>` &rarr; Retrieve single record by ID.
- `PUT /api/food-records/<id>` &rarr; Update record with cross-field validation.
- `DELETE /api/food-records/<id>` &rarr; Delete record permanently.

### Machine Learning & Recommendations
- `POST /api/predict` &rarr; Predict consumption, estimated waste, and optimal prep batch with safety buffer.
- `GET /api/predict/metrics` &rarr; Model accuracy metrics ($R^2$, MAE, RMSE, sample counts, feature importances).
- `GET /api/predict/items` &rarr; Unique food items, categories, and meal options for UI dropdowns.
- `GET /api/recommendations` &rarr; Dynamic rule-based actionable insights (Critical, Warning, Success, Info).
- `GET /api/recommendations/preparation` &rarr; Item-by-item demand forecast and preparation optimization table.

### PySpark Big Data Pipeline
- `POST /api/spark/process` &rarr; Triggers the 5-stage PySpark pipeline over raw CSV data.
- `GET /api/spark/status` &rarr; Status, duration, stages, and execution summary of the latest Spark run.
- `GET /api/spark/results` &rarr; Aggregated data marts produced by Spark operations.

### Reports
- `GET /api/reports?format=pdf&period=all` &rarr; Download ReportLab-generated analytical PDF audit report.
- `GET /api/reports?format=csv&period=all` &rarr; Download raw dataset in CSV format.

---

## 8. Directory Structure

```
c:\Users\Sudarshan\Downloads\BD MINI porject\
├── backend/
│   ├── app/
│   │   ├── __init__.py                # Flask app factory with SQLite & CORS
│   │   ├── models/
│   │   │   ├── __init__.py
│   │   │   └── food_record.py         # SQLAlchemy FoodWasteRecord model
│   │   ├── routes/
│   │   │   ├── __init__.py
│   │   │   ├── dashboard.py           # Dashboard KPIs and charts endpoint
│   │   │   ├── records.py             # Full CRUD records endpoints
│   │   │   ├── analytics.py           # Multi-dimensional analytics endpoints
│   │   │   ├── predictions.py         # ML prediction & metrics endpoints
│   │   │   ├── recommendations.py     # Actionable recommendations endpoints
│   │   │   ├── spark_routes.py        # PySpark trigger & status endpoints
│   │   │   └── reports.py             # CSV/PDF report download endpoints
│   │   ├── services/
│   │   │   ├── __init__.py
│   │   │   ├── recommendation_service.py # Rule-based recommendation engine
│   │   │   └── report_service.py      # ReportLab PDF & CSV builder
│   │   ├── spark/
│   │   │   ├── __init__.py
│   │   │   └── processor.py           # PySpark 5-stage processing pipeline
│   │   ├── ml/
│   │   │   ├── __init__.py
│   │   │   └── predictor.py           # Random Forest Regressor & trainer
│   │   └── utils/
│   │       ├── __init__.py
│   │       └── helpers.py             # Date parsing & arithmetic helpers
│   ├── instance/
│   │   └── foodwaste.db               # Populated SQLite database
│   ├── generate_dataset.py            # Generates 10,749 realistic records
│   ├── init_db.py                     # Schema initialization and CSV seeder
│   ├── requirements.txt               # Backend dependencies
│   ├── run.py                         # REST API entrypoint (use_reloader=False)
│   └── test_api.py                    # 15-test automated verification suite
├── data/
│   ├── raw/
│   │   └── food_waste_data.csv        # 10,749 raw canteen records
│   ├── processed/
│   │   └── processed_food_waste.csv   # Cleaned & transformed dataset
│   ├── aggregated/                    # PySpark JSON data marts
│   │   ├── category_waste.json
│   │   ├── meal_waste.json
│   │   ├── top_wasted_items.json
│   │   ├── monthly_trends.json
│   │   └── financial_loss.json
│   └── spark_status.json              # Spark pipeline report
├── models/
│   ├── demand_predictor.joblib        # Trained Random Forest model
│   └── model_meta.joblib              # Label encoders & evaluation metrics
├── frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js                 # Explicit IPv4 proxy (127.0.0.1:5000)
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── App.jsx                    # React Router configuration
│       ├── main.jsx
│       ├── index.css
│       ├── layouts/
│       │   └── MainLayout.jsx         # Sidebar navigation layout
│       ├── components/
│       │   ├── Sidebar.jsx            # Dark green navigation bar with badges
│       │   ├── KPICard.jsx            # Color-coded metric card
│       │   ├── DateFilter.jsx         # Time range selector
│       │   ├── LoadingSpinner.jsx
│       │   ├── Notification.jsx       # Auto-dismiss toast
│       │   ├── ConfirmDialog.jsx      # Modal delete confirmation
│       │   └── EmptyState.jsx
│       ├── pages/
│       │   ├── Dashboard.jsx          # KPI cards, Recharts visualizations
│       │   ├── FoodWasteAnalytics.jsx # Category, meal, trends, financial tabs
│       │   ├── DemandPrediction.jsx   # Interactive ML forecasting & buffer slider
│       │   ├── Recommendations.jsx    # Action cards & preparation target table
│       │   ├── RecordManagement.jsx   # Searchable CRUD table with modal
│       │   ├── BigDataProcessing.jsx  # PySpark 5-stage pipeline runner
│       │   └── Reports.jsx            # PDF and CSV download interface
│       ├── services/
│       │   └── api.js                 # Axios API service (direct 127.0.0.1:5000)
│       └── utils/
│           └── formatters.js          # Currency (₹), numbers, dates
└── README.md
```

---

## 9. Setup & Execution Instructions

### Prerequisites
- **Python:** Version 3.10 to 3.14 (Tested on Python 3.14)
- **Node.js:** Version 18+ (Tested on Node 22 with npm 11)
- **Java JDK:** JDK 17 or JDK 21 (Tested on `C:\Program Files\Java\jdk-21`; ensure `JAVA_HOME` is set)

### Step 1: Install Backend Python Dependencies
```powershell
cd "c:\Users\Sudarshan\Downloads\BD MINI porject\backend"
pip install -r requirements.txt
```

### Step 2: Generate Dataset and Seed SQLite Database
```powershell
# 1. Generate 10,749 realistic records spanning 1 year
python generate_dataset.py

# 2. Initialize SQLite tables and populate all records
python init_db.py --reset
```

### Step 3: Run the Backend Verification Test Suite
```powershell
python test_api.py
```
*(All 15 endpoints should return `[OK]`)*.

### Step 4: Start the Flask Backend Server
```powershell
python run.py
```
*The server will listen at `http://127.0.0.1:5000`.*

### Step 5: Install Frontend Dependencies and Start Vite
In a **second** terminal window:
```powershell
cd "c:\Users\Sudarshan\Downloads\BD MINI porject\frontend"
npm install
npm run dev
```
*The React application will open at **`http://localhost:5173`**.*

---

## 10. Technical Troubleshooting & Architecture Notes

### 1. Windows IPv6 `ECONNREFUSED ::1:5000`
- **Issue:** Node.js 18+ on Windows resolves `localhost` to IPv6 `::1` by default, whereas the Python Flask server binds to IPv4 (`127.0.0.1`).
- **Fix Applied:** Configured `frontend/src/services/api.js` and `frontend/vite.config.js` to target `http://127.0.0.1:5000` explicitly, with Flask-CORS enabled for cross-origin calls.

### 2. PySpark File Watchdog Restart
- **Issue:** Flask's development reloader (`watchdog`) detects internal file accesses under `pyspark/` during initialization and restarts the server mid-request.
- **Fix Applied:** Configured `backend/run.py` with `app.run(..., debug=True, use_reloader=False)`, ensuring distributed Spark batch operations complete without interruption.

---

## 11. Academic Viva & Demonstration Guide

| Demonstration Step | Target URL | What to Show & Explain to the Evaluator |
|---|---|---|
| **1. Big Data Processing** | `/big-data` | Click **"Execute PySpark Pipeline"**. Point out that this is an authentic PySpark pipeline operating on 10,749 records across 5 DAG stages (`Ingestion`, `Cleaning`, `Transformation`, `Aggregation`, `Export`). Show that 106 duplicates were purged, missing values imputed, and aggregated JSON data marts generated. |
| **2. Executive Dashboard** | `/dashboard` | Demonstrate the 6 KPI cards (Total Prepared, Consumed, Wasted, Waste %, Financial Loss in ₹, Items Monitored). Change date filters (**Today**, **7 Days**, **30 Days**, **All Time**, **Custom**) and show how the 6 Recharts diagrams update dynamically. |
| **3. Waste Analytics** | `/analytics` | Walk through the 4 analytical tabs: **Category Analysis** (bar chart & breakdown table), **Meal Analysis** (Breakfast vs Lunch vs Dinner), **Trends** (Day-of-the-week pattern & monthly progression), and **Financial Loss** (cost impact by food category). |
| **4. Demand Prediction** | `/prediction` | Select a food item (e.g. *Plain Rice*), meal period (*Lunch*), and planned preparation batch. Adjust the **Safety Buffer %** slider. Click **Predict Demand & Optimal Prep**. Show the predicted consumption, potential savings, and model metrics ($R^2 = 0.983$, $MAE = 0.701\text{ kg}$). |
| **5. Recommendations** | `/recommendations` | Show dynamic rule-based cards categorizing issues into Critical, Warning, Success, and Info. Review the **Preparation Optimization Table** illustrating optimal cooking targets. |
| **6. Record Management** | `/records` | Click **"Add Food Record"**. Demonstrate form validation: consumed quantity cannot exceed prepared quantity. Show searching and filtering across records. |
| **7. Report Export** | `/reports` | Click **"Download PDF Report"** to view the ReportLab-generated audit document with sustainability branding. Click **"Download CSV Dataset"** to export raw spreadsheet data. |

---

## 12. Frequently Asked Viva Questions (BDSMA)

**Q1: Why use Apache PySpark instead of Pandas for this project?**  
*Answer:* Pandas operates in-memory on a single CPU core and cannot scale beyond available RAM. PySpark employs distributed Spark DataFrames with lazy evaluation, DAG optimization (Catalyst Optimizer), and partition-level parallelism. In an institutional scenario processing millions of meal records across multi-campus universities, PySpark scales horizontally across compute clusters.

**Q2: How is data leakage prevented in the Demand Prediction module?**  
*Answer:* The Machine Learning features include only variables available *before* the meal is cooked (food item, category, meal period, day of week, month, and special event status). Target variables or post-service quantities (actual consumed, wasted, students served) are strictly excluded from the input feature vector.

**Q3: How does the Safety Buffer prevent food shortages?**  
*Answer:* Food consumption in canteens is subject to stochastic attendance fluctuations. A raw prediction ($\hat{y}$) provides the expected mean demand. By adding an adjustable safety buffer percentage (e.g. 10%), the recommended preparation becomes $\hat{y} \times 1.10$, creating an operational buffer against stockouts while curtailing surplus preparation.

---

## 13. License & Authorship
- **Course:** Big Data and Social Media Analytics (BDSMA) Microproject
- **Academic Year:** 2025–2026
- **Status:** Complete, Functional, Fully Tested
