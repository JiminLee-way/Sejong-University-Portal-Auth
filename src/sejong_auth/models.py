from enum import Enum

from pydantic import BaseModel


class Semester(str, Enum):
    FIRST = "1학기"
    SECOND = "2학기"
    SUMMER = "여름학기"
    WINTER = "겨울학기"


# ── 기이수 성적 ──


class Grade(BaseModel):
    year: int
    semester: Semester
    course_code: str
    section: str
    course_name: str
    course_type: str
    graduation_course_type: str
    credit: float
    grade: str
    grade_point: float
    evaluation_type: str
    retake: bool
    elective_area: str | None = None
    teaching_area: str | None = None


class CreditSummary(BaseModel):
    liberal_required: float
    liberal_total: float
    major_required: float
    major_elective: float
    major_basic: float
    major_total: float


class GradeReport(BaseModel):
    student_id: str
    student_name: str
    major: str
    year_level: int
    grades: list[Grade]
    credit_summary: CreditSummary
    total_gpa: float
    total_earned_credits: float
    total_attempted_credits: float
    graduation_credits: float
    liberal_gpa: float
    major_gpa: float
    percentile: float


# ── 수강내역 ──


class Enrollment(BaseModel):
    year: int
    semester: Semester
    course_code: str
    section: str
    course_name: str
    course_type: str
    credit: float
    professor: str | None = None
    time_location: str | None = None


class EnrollmentReport(BaseModel):
    student_id: str
    year: int
    semester: Semester
    enrollments: list[Enrollment]
    total_credits: float


# ── 장학이력 ──


class Scholarship(BaseModel):
    year: int
    semester: Semester
    scholarship_name: str
    amount: int


class ScholarshipReport(BaseModel):
    student_id: str
    scholarships: list[Scholarship]
    total_amount: int
