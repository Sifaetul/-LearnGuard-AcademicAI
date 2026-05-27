def calculate_risk_scores():
    students = [
        {"id": "S001", "name": "Rafiq Ahmed",    "attendance": 45, "quiz_avg": 38, "late_submissions": 5},
        {"id": "S002", "name": "Priya Das",       "attendance": 92, "quiz_avg": 78, "late_submissions": 0},
        {"id": "S003", "name": "Mehedi Hasan",    "attendance": 67, "quiz_avg": 55, "late_submissions": 2},
        {"id": "S004", "name": "Fatima Khanam",   "attendance": 30, "quiz_avg": 25, "late_submissions": 7},
        {"id": "S005", "name": "Tanvir Islam",    "attendance": 88, "quiz_avg": 82, "late_submissions": 1},
        {"id": "S006", "name": "Nusrat Jahan",    "attendance": 55, "quiz_avg": 45, "late_submissions": 4},
        {"id": "S007", "name": "Sabbir Rahman",   "attendance": 78, "quiz_avg": 70, "late_submissions": 1},
        {"id": "S008", "name": "Ayesha Siddiqua", "attendance": 40, "quiz_avg": 32, "late_submissions": 6},
    ]

    result = []
    for s in students:
        attendance_risk  = (100 - s["attendance"])  * 0.40
        quiz_risk        = (100 - s["quiz_avg"])     * 0.35
        submission_risk  = min(s["late_submissions"] * 5, 25) * 0.25

        score = round(attendance_risk + quiz_risk + submission_risk, 1)

        if score > 60:
            level = "HIGH"
        elif score > 35:
            level = "MEDIUM"
        else:
            level = "LOW"

        result.append({
            **s,
            "risk_score": score,
            "risk_level": level,
        })

    summary = {
        "total":  len(result),
        "high":   len([s for s in result if s["risk_level"] == "HIGH"]),
        "medium": len([s for s in result if s["risk_level"] == "MEDIUM"]),
        "low":    len([s for s in result if s["risk_level"] == "LOW"]),
    }

    return {"students": result, "summary": summary}