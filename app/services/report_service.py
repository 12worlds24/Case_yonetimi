"""
Report service for dynamic report generation
"""
from sqlalchemy.orm import Session
from typing import Dict, List, Any, Optional
from app.models.report import ReportDefinition, ReportTemplate
from app.utils.logger import get_logger
from app.utils.retry import retry_database

logger = get_logger("service.reports")


class ReportService:
    """Service for generating reports"""
    
    def __init__(self, db: Session):
        self.db = db
    
    @retry_database
    def get_report_definitions(self, skip: int = 0, limit: int = 100) -> List[ReportDefinition]:
        """Get list of report definitions"""
        return self.db.query(ReportDefinition).filter(
            ReportDefinition.is_active == 1
        ).offset(skip).limit(limit).all()
    
    @retry_database
    def get_report_definition(self, report_id: int) -> Optional[ReportDefinition]:
        """Get report definition by ID"""
        return self.db.query(ReportDefinition).filter(
            ReportDefinition.id == report_id,
            ReportDefinition.is_active == 1
        ).first()
    
    @retry_database
    def execute_report(self, report_id: int, params: Optional[Dict[str, Any]] = None) -> List[Dict]:
        """
        Execute report query and return results
        Note: This is a simplified version. In production, use parameterized queries
        and validate inputs to prevent SQL injection.
        """
        report = self.get_report_definition(report_id)
        if not report:
            raise ValueError(f"Report {report_id} not found")
        
        try:
            # Execute query (simplified - should use proper parameterization)
            result = self.db.execute(report.query)
            columns = result.keys()
            rows = result.fetchall()
            
            # Convert to list of dicts
            return [dict(zip(columns, row)) for row in rows]
        except Exception as e:
            logger.exception(f"Error executing report {report_id}: {e}")
            raise
    
    @retry_database
    def create_report_template(self, name: str, description: str, template_data: Dict) -> ReportTemplate:
        """Create new report template"""
        template = ReportTemplate(
            name=name,
            description=description,
            template_data=template_data
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template
    
    @retry_database
    def get_report_templates(self, skip: int = 0, limit: int = 100) -> List[ReportTemplate]:
        """Get list of report templates"""
        return self.db.query(ReportTemplate).offset(skip).limit(limit).all()

