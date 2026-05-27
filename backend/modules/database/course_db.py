COURSES = {
    "CSE101": {
        "code": "CSE101", "title": "Introduction to Computer Science",
        "credits": 3, "dept": "CSE", "semester": 1,
        "teacher": "DR001", "schedule": "Sun,Tue,Thu 9:00AM", "room": "AB1-301",
        "lectures": [
            {"no":1,"title":"Introduction to Computers","topics":["History","Components","I/O devices"]},
            {"no":2,"title":"Number Systems","topics":["Binary","Decimal","Hex","Conversion"]},
            {"no":3,"title":"Logic Gates","topics":["AND/OR/NOT","Truth tables","Boolean Algebra"]},
            {"no":4,"title":"Introduction to Programming","topics":["Algorithm","Flowchart","Pseudocode"]},
            {"no":5,"title":"Data Types & Variables","topics":["Primitive types","Variables","Constants"]},
        ],
        "assignments": [
            {"no":1,"title":"Number System Conversion","deadline":"Week 4","marks":10,
             "instructions":"Convert 10 decimal numbers to binary, octal, hex. Show all steps. Submit PDF via BLC."},
            {"no":2,"title":"Logic Gate Circuit Design","deadline":"Week 7","marks":15,
             "instructions":"Design 3 logic circuits. Draw truth tables. Submit PDF via BLC."},
        ],
        "labs": [
            {"no":1,"title":"Basic Programming Lab","deadline":"Week 5","marks":20,
             "instructions":"Write 5 C programs with comments. Report: Cover+Code+Output+Explanation. Submit ZIP+PDF."},
            {"no":2,"title":"Logic Circuit Simulation","deadline":"Week 8","marks":20,
             "instructions":"Use Logisim to simulate 4 circuits. Submit screenshots+analysis PDF."},
        ],
        "presentations": [
            {"no":1,"title":"Future of Computing","deadline":"Week 10","marks":15,
             "instructions":"Group of 3. 10-min presentation on AI/Quantum/Cloud. Min 10 slides. Submit PPT via BLC."},
        ],
        "exams": {
            "midterm":{"date":"Week 8","marks":30,"syllabus":"Lecture 1-5",
                       "format":"MCQ(20) + Short Answer(2) + Problem Solving(1)"},
            "final":{"date":"Week 16","marks":40,"syllabus":"All lectures",
                     "format":"MCQ(30) + Short Answer(3) + Problem Solving(2)"},
        },
        "grading":{"attendance":10,"assignments":10,"lab":20,"presentation":10,"midterm":20,"final":30},
    },
    "CSE201": {
        "code": "CSE201", "title": "Object Oriented Programming",
        "credits": 3, "dept": "CSE", "semester": 3,
        "teacher": "DR002", "schedule": "Mon,Wed 11:00AM", "room": "AB2-201",
        "lectures": [
            {"no":1,"title":"OOP Fundamentals","topics":["Classes vs Objects","Abstraction","Real examples"]},
            {"no":2,"title":"Classes and Objects","topics":["Class declaration","Constructors","this keyword"]},
            {"no":3,"title":"Encapsulation","topics":["Access modifiers","Getters/Setters","Data hiding"]},
            {"no":4,"title":"Inheritance","topics":["Single/Multilevel","super keyword","Method overriding"]},
            {"no":5,"title":"Polymorphism","topics":["Overloading","Abstract classes","Interfaces"]},
        ],
        "assignments": [
            {"no":1,"title":"Class Design","deadline":"Week 3","marks":10,
             "instructions":"Design 3 Java classes with encapsulation. Include UML diagram. Submit ZIP+PDF via BLC."},
            {"no":2,"title":"Inheritance Hierarchy","deadline":"Week 6","marks":15,
             "instructions":"Create 4-level inheritance hierarchy. Demonstrate all OOP concepts. Submit via BLC."},
        ],
        "labs": [
            {"no":1,"title":"Java Basics Lab","deadline":"Week 4","marks":20,
             "instructions":"10 Java programs: variables, loops, arrays. Report: Cover+Code+Output+Analysis."},
            {"no":2,"title":"OOP Implementation","deadline":"Week 9","marks":20,
             "instructions":"Build Bank or Library system using all OOP concepts. Full report with UML."},
        ],
        "presentations": [],
        "exams": {
            "midterm":{"date":"Week 8","marks":30,"syllabus":"Lecture 1-4",
                       "format":"Theory(15) + Code Writing(15)"},
            "final":{"date":"Week 16","marks":40,"syllabus":"All lectures",
                     "format":"Theory(20) + Code Writing(20)"},
        },
        "grading":{"attendance":10,"assignments":15,"lab":20,"midterm":25,"final":30},
    },
    "CSE301": {
        "code": "CSE301", "title": "Data Structures & Algorithms",
        "credits": 3, "dept": "CSE", "semester": 4,
        "teacher": "DR001", "schedule": "Sun,Tue 2:00PM", "room": "AB1-401",
        "lectures": [
            {"no":1,"title":"Arrays & Linked Lists","topics":["Static vs Dynamic","Singly/Doubly linked","Operations"]},
            {"no":2,"title":"Stack & Queue","topics":["LIFO/FIFO","Implementation","Applications"]},
            {"no":3,"title":"Trees","topics":["Binary tree","BST","Tree traversal","AVL tree"]},
            {"no":4,"title":"Sorting Algorithms","topics":["Bubble/Selection/Insertion","Merge/Quick sort","Complexity"]},
            {"no":5,"title":"Graph Algorithms","topics":["BFS","DFS","Dijkstra","Minimum spanning tree"]},
        ],
        "assignments": [
            {"no":1,"title":"Linked List Implementation","deadline":"Week 4","marks":15,
             "instructions":"Implement singly and doubly linked list in C/Java with all operations. Submit via BLC."},
        ],
        "labs": [
            {"no":1,"title":"Sorting Lab","deadline":"Week 6","marks":25,
             "instructions":"Implement 4 sorting algorithms. Compare time complexity with graphs. Full report required."},
        ],
        "presentations": [],
        "exams": {
            "midterm":{"date":"Week 8","marks":30,"syllabus":"Lecture 1-3","format":"Theory(10)+Code(20)"},
            "final":{"date":"Week 16","marks":40,"syllabus":"All","format":"Theory(15)+Code(25)"},
        },
        "grading":{"attendance":10,"assignments":15,"lab":25,"midterm":20,"final":30},
    },
}

TEACHERS = {
    "DR001": {
        "id":"DR001", "name":"Dr. Mohammad Rahman", "title":"Professor",
        "dept":"CSE", "email":"m.rahman@diu.edu.bd",
        "office":"AB1, Room 502", "office_hours":"Sun & Tue 2:00-4:00 PM",
        "education":[
            {"degree":"PhD","field":"Computer Science","university":"University of Tokyo","year":2008},
            {"degree":"MSc","field":"Software Engineering","university":"BUET","year":2003},
        ],
        "specialization":["Algorithms","Data Structures","Competitive Programming"],
        "research":["Graph Optimization","Algorithm Design","Data Mining"],
        "courses_teaching":["CSE101","CSE301"],
        "publications": 24,
        "experience_years": 18,
    },
    "DR002": {
        "id":"DR002", "name":"Dr. Fatema Begum", "title":"Associate Professor",
        "dept":"CSE", "email":"f.begum@diu.edu.bd",
        "office":"AB2, Room 301", "office_hours":"Mon & Wed 3:00-5:00 PM",
        "education":[
            {"degree":"PhD","field":"Software Engineering","university":"Monash University","year":2012},
            {"degree":"BSc","field":"CSE","university":"DIU","year":2006},
        ],
        "specialization":["OOP","Software Design","Java Programming"],
        "research":["Design Patterns","Agile Development","Code Quality"],
        "courses_teaching":["CSE201"],
        "publications": 15,
        "experience_years": 12,
    },
    "DR003": {
        "id":"DR003", "name":"Prof. Karim Hossain", "title":"Professor",
        "dept":"EEE", "email":"k.hossain@diu.edu.bd",
        "office":"AB3, Room 201", "office_hours":"Sat & Mon 10:00AM-12:00PM",
        "education":[
            {"degree":"PhD","field":"Electrical Engineering","university":"IIT Delhi","year":2007},
            {"degree":"MSc","field":"EEE","university":"BUET","year":2002},
        ],
        "specialization":["Circuit Design","Signal Processing","Embedded Systems"],
        "research":["IoT","Smart Grid","Renewable Energy"],
        "courses_teaching":["EEE101"],
        "publications": 31,
        "experience_years": 20,
    },
}

def get_course_context(course_id: str) -> str:
    course = COURSES.get(course_id.upper())
    if not course:
        return f"Course {course_id} not found in database."
    
    teacher = TEACHERS.get(course["teacher"], {})
    
    ctx = f"""
=== COURSE INFORMATION ===
Code: {course['code']} | Title: {course['title']}
Credits: {course['credits']} | Department: {course['dept']} | Semester: {course['semester']}
Schedule: {course['schedule']} | Room: {course['room']}

=== TEACHER ===
Name: {teacher.get('name','N/A')} | Title: {teacher.get('title','')}
Email: {teacher.get('email','')} | Office: {teacher.get('office','')}
Office Hours: {teacher.get('office_hours','')}
Specialization: {', '.join(teacher.get('specialization',[]))}
Experience: {teacher.get('experience_years','')} years | Publications: {teacher.get('publications','')}

=== LECTURES ===
"""
    for lec in course['lectures']:
        ctx += f"Lecture {lec['no']}: {lec['title']}\n  Topics: {', '.join(lec['topics'])}\n"

    ctx += "\n=== ASSIGNMENTS ===\n"
    for a in course['assignments']:
        ctx += f"Assignment {a['no']}: {a['title']}\n  Deadline: {a['deadline']} | Marks: {a['marks']}\n  Instructions: {a['instructions']}\n\n"

    ctx += "\n=== LAB REPORTS ===\n"
    for l in course['labs']:
        ctx += f"Lab {l['no']}: {l['title']}\n  Deadline: {l['deadline']} | Marks: {l['marks']}\n  Instructions: {l['instructions']}\n\n"

    if course['presentations']:
        ctx += "\n=== PRESENTATIONS ===\n"
        for p in course['presentations']:
            ctx += f"Presentation {p['no']}: {p['title']}\n  Deadline: {p['deadline']} | Instructions: {p['instructions']}\n\n"

    ctx += f"""
=== EXAMS ===
Midterm: {course['exams']['midterm']['date']} | Marks: {course['exams']['midterm']['marks']} | Syllabus: {course['exams']['midterm']['syllabus']}
Format: {course['exams']['midterm']['format']}

Final: {course['exams']['final']['date']} | Marks: {course['exams']['final']['marks']} | Syllabus: {course['exams']['final']['syllabus']}
Format: {course['exams']['final']['format']}

=== GRADING BREAKDOWN ===
"""
    for k, v in course['grading'].items():
        ctx += f"{k.title()}: {v}%\n"

    return ctx