"""
Report models for flexible reporting
"""
from sqlalchemy import Column, String, Text, JSON, Integer
from app.models.base import BaseModel


class CustomField(BaseModel):
    """Custom field definitions for flexible data structure"""
    __tablename__ = "custom_fields"
    
    field_name = Column(String(100), nullable=False, unique=True, index=True)
    field_type = Column(String(50), nullable=False)  # text, number, date, select, etc.
    table_name = Column(String(100), nullable=False, index=True)  # customers, products, cases, etc.
    label = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    options = Column(JSON, nullable=True)  # For select fields
    is_required = Column(Integer, default=0, nullable=False)  # 0=optional, 1=required
    validation_rules = Column(JSON, nullable=True)
    
    def __repr__(self):
        return f"<CustomField(id={self.id}, field_name='{self.field_name}')>"


class ReportTemplate(BaseModel):
    """Report templates"""
    __tablename__ = "report_templates"
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    template_data = Column(JSON, nullable=False)  # Report configuration in JSON
    created_by = Column(Integer, nullable=True)
    is_public = Column(Integer, default=0, nullable=False)  # 0=private, 1=public
    
    def __repr__(self):
        return f"<ReportTemplate(id={self.id}, name='{self.name}')>"


class ReportDefinition(BaseModel):
    """Report definitions with query and chart configuration"""
    __tablename__ = "report_definitions"
    
    name = Column(String(255), nullable=False, index=True)
    description = Column(Text, nullable=True)
    query = Column(Text, nullable=False)  # SQL query (parameterized)
    query_params = Column(JSON, nullable=True)  # Query parameters
    filters = Column(JSON, nullable=True)  # Filter configuration
    chart_type = Column(String(50), nullable=True)  # bar, line, pie, etc.
    chart_config = Column(JSON, nullable=True)  # Chart.js configuration
    group_by = Column(String(255), nullable=True)
    order_by = Column(String(255), nullable=True)
    created_by = Column(Integer, nullable=True)
    is_active = Column(Integer, default=1, nullable=False)  # 0=inactive, 1=active
    
    def __repr__(self):
        return f"<ReportDefinition(id={self.id}, name='{self.name}')>"









