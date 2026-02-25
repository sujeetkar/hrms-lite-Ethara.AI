from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, field_validator
from sqlalchemy import create_engine, Column, String, Date, Enum as SAEnum, DateTime, func
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from datetime import date, datetime
import enum
import re
import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./hrms.db")

# SQLite fix for render/railway (postgres uses postgresql://)
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in DATABASE_URL else {}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ─── Models ────────────────────────────────────────────────────────────────────

class AttendanceStatus(str, enum.Enum):
    present = "Present"
    absent = "Absent"

class Employee(Base):
    __tablename__ = "employees"
    employee_id = Column(String, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    department = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

class Attendance(Base):
    __tablename__ = "attendance"
    id = Column(String, primary_key=True)
    employee_id = Column(String, nullable=False, index=True)
    date = Column(Date, nullable=False)
    status = Column(SAEnum(AttendanceStatus), nullable=False)

Base.metadata.create_all(bind=engine)

# ─── Schemas ───────────────────────────────────────────────────────────────────

class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str

    @field_validator("email")
    @classmethod
    def validate_email(cls, v):
        pattern = r'^[\w\.-]+@[\w\.-]+\.\w{2,}$'
        if not re.match(pattern, v):
            raise ValueError("Invalid email format")
        return v

    @field_validator("employee_id", "full_name", "department")
    @classmethod
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError("Field cannot be empty")
        return v.strip()

class EmployeeOut(BaseModel):
    employee_id: str
    full_name: str
    email: str
    department: str
    created_at: datetime

    class Config:
        from_attributes = True

class AttendanceCreate(BaseModel):
    employee_id: str
    date: date
    status: AttendanceStatus

class AttendanceOut(BaseModel):
    id: str
    employee_id: str
    date: date
    status: AttendanceStatus

    class Config:
        from_attributes = True

# ─── App ───────────────────────────────────────────────────────────────────────

app = FastAPI(title="HRMS Lite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ─── Employee Endpoints ────────────────────────────────────────────────────────

@app.get("/")
def root():
    return {"message": "HRMS Lite API is running", "version": "1.0.0"}

@app.get("/api/employees", response_model=list[EmployeeOut])
def list_employees(db: Session = Depends(get_db)):
    return db.query(Employee).order_by(Employee.created_at.desc()).all()

@app.post("/api/employees", response_model=EmployeeOut, status_code=201)
def create_employee(payload: EmployeeCreate, db: Session = Depends(get_db)):
    if db.query(Employee).filter(Employee.employee_id == payload.employee_id).first():
        raise HTTPException(status_code=409, detail=f"Employee ID '{payload.employee_id}' already exists")
    if db.query(Employee).filter(Employee.email == payload.email).first():
        raise HTTPException(status_code=409, detail=f"Email '{payload.email}' is already registered")
    emp = Employee(**payload.model_dump())
    db.add(emp)
    db.commit()
    db.refresh(emp)
    return emp

@app.delete("/api/employees/{employee_id}", status_code=204)
def delete_employee(employee_id: str, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.employee_id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    db.query(Attendance).filter(Attendance.employee_id == employee_id).delete()
    db.delete(emp)
    db.commit()

# ─── Attendance Endpoints ──────────────────────────────────────────────────────

@app.get("/api/attendance", response_model=list[AttendanceOut])
def list_attendance(employee_id: str | None = None, date_filter: date | None = None, db: Session = Depends(get_db)):
    q = db.query(Attendance)
    if employee_id:
        q = q.filter(Attendance.employee_id == employee_id)
    if date_filter:
        q = q.filter(Attendance.date == date_filter)
    return q.order_by(Attendance.date.desc()).all()

@app.post("/api/attendance", response_model=AttendanceOut, status_code=201)
def mark_attendance(payload: AttendanceCreate, db: Session = Depends(get_db)):
    emp = db.query(Employee).filter(Employee.employee_id == payload.employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Employee not found")
    existing = db.query(Attendance).filter(
        Attendance.employee_id == payload.employee_id,
        Attendance.date == payload.date
    ).first()
    if existing:
        existing.status = payload.status
        db.commit()
        db.refresh(existing)
        return existing
    import uuid
    record = Attendance(id=str(uuid.uuid4()), **payload.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@app.get("/api/dashboard")
def dashboard(db: Session = Depends(get_db)):
    total_employees = db.query(Employee).count()
    total_present_today = db.query(Attendance).filter(
        Attendance.date == date.today(),
        Attendance.status == AttendanceStatus.present
    ).count()
    total_absent_today = db.query(Attendance).filter(
        Attendance.date == date.today(),
        Attendance.status == AttendanceStatus.absent
    ).count()
    departments = db.query(Employee.department, func.count(Employee.employee_id)).group_by(Employee.department).all()
    return {
        "total_employees": total_employees,
        "present_today": total_present_today,
        "absent_today": total_absent_today,
        "departments": [{"name": d[0], "count": d[1]} for d in departments]
    }