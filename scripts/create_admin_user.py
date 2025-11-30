"""
Script to create initial admin user
Run: python scripts/create_admin_user.py
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import init_database, get_db_context
from app.models.user import User, Department, Role
from app.auth.security import hash_password

def create_admin_user():
    """Create initial admin user"""
    init_database()
    
    with get_db_context() as db:
        # Check if admin user already exists
        existing = db.query(User).filter(User.email == "admin@3-d.com.tr").first()
        if existing:
            print("Admin user already exists!")
            return
        
        # Create IT department if not exists
        dept = db.query(Department).filter(Department.name == "IT").first()
        if not dept:
            dept = Department(name="IT", description="IT Departmanı")
            db.add(dept)
            db.flush()
            print(f"Created department: {dept.name}")
        
        # Create Admin role if not exists
        admin_role = db.query(Role).filter(Role.name == "Admin").first()
        if not admin_role:
            admin_role = Role(name="Admin", description="Yönetici rolü")
            db.add(admin_role)
            db.flush()
            print(f"Created role: {admin_role.name}")
        
        # Create admin user
        password_hash = hash_password("password123")
        admin_user = User(
            email="admin@3-d.com.tr",
            password_hash=password_hash,
            full_name="Admin User",
            is_active=1,
            department_id=dept.id
        )
        db.add(admin_user)
        db.flush()
        
        # Assign admin role
        admin_user.roles.append(admin_role)
        db.commit()
        
        print("=" * 50)
        print("Admin user created successfully!")
        print("=" * 50)
        print(f"Email: admin@3-d.com.tr")
        print(f"Password: password123")
        print(f"Department: {dept.name}")
        print(f"Role: {admin_role.name}")
        print("=" * 50)

if __name__ == "__main__":
    create_admin_user()









