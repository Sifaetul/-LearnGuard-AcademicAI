def get_kpi_data():
    return {
        "university": "Daffodil International University",
        "semester": "Spring 2025",
        "kpis": {
            "total_students": 12450,
            "active_this_semester": 11800,
            "retention_rate": 94.8,
            "avg_cgpa": 3.21,
            "at_risk_students": 847,
            "courses_running": 312,
            "faculty_count": 680,
        },
        "obe": {
            "clo_attainment_avg": 72.4,
            "plo_attainment_avg": 68.9,
            "courses_meeting_target": 241,
            "courses_below_target": 71,
        },
        "monthly_attendance": [
            {"month": "Jan", "rate": 82},
            {"month": "Feb", "rate": 79},
            {"month": "Mar", "rate": 85},
            {"month": "Apr", "rate": 76},
            {"month": "May", "rate": 88},
        ],
        "department_performance": [
            {"dept": "CSE",  "avg_cgpa": 3.35, "at_risk": 120},
            {"dept": "EEE",  "avg_cgpa": 3.18, "at_risk": 98},
            {"dept": "BBA",  "avg_cgpa": 3.22, "at_risk": 210},
            {"dept": "Law",  "avg_cgpa": 3.10, "at_risk": 87},
            {"dept": "Arch", "avg_cgpa": 3.41, "at_risk": 45},
        ]
    }