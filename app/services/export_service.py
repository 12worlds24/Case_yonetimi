"""
Export service for data export (Excel, CSV, PDF)
"""
import pandas as pd
from io import BytesIO
from typing import List, Dict, Any
from pathlib import Path
from app.utils.logger import get_logger
from app.utils.retry import retry_file_system

logger = get_logger("service.export")


class ExportService:
    """Service for exporting data to various formats"""
    
    @retry_file_system
    def export_to_excel(self, data: List[Dict[str, Any]], filename: str = "export.xlsx") -> BytesIO:
        """Export data to Excel format"""
        try:
            df = pd.DataFrame(data)
            output = BytesIO()
            
            with pd.ExcelWriter(output, engine='openpyxl') as writer:
                df.to_excel(writer, index=False, sheet_name='Data')
            
            output.seek(0)
            logger.info(f"Data exported to Excel: {len(data)} rows")
            return output
        except Exception as e:
            logger.exception(f"Error exporting to Excel: {e}")
            raise
    
    @retry_file_system
    def export_to_csv(self, data: List[Dict[str, Any]], filename: str = "export.csv") -> str:
        """Export data to CSV format"""
        try:
            df = pd.DataFrame(data)
            csv_string = df.to_csv(index=False)
            logger.info(f"Data exported to CSV: {len(data)} rows")
            return csv_string
        except Exception as e:
            logger.exception(f"Error exporting to CSV: {e}")
            raise
    
    @retry_file_system
    def export_to_json(self, data: List[Dict[str, Any]]) -> str:
        """Export data to JSON format"""
        import json
        try:
            json_string = json.dumps(data, indent=2, default=str, ensure_ascii=False)
            logger.info(f"Data exported to JSON: {len(data)} rows")
            return json_string
        except Exception as e:
            logger.exception(f"Error exporting to JSON: {e}")
            raise
    
    def prepare_case_export(self, cases: List[Dict]) -> List[Dict]:
        """Prepare case data for export"""
        export_data = []
        for case in cases:
            export_data.append({
                'ID': case.get('id'),
                'Başlık': case.get('title'),
                'Müşteri': case.get('customer', {}).get('name', 'N/A'),
                'Ürün': case.get('product', {}).get('name', 'N/A'),
                'Öncelik': case.get('priority'),
                'Durum': case.get('status'),
                'Oluşturulma': case.get('created_at'),
                'Güncelleme': case.get('updated_at')
            })
        return export_data
    
    def prepare_customer_export(self, customers: List[Dict]) -> List[Dict]:
        """Prepare customer data for export"""
        export_data = []
        for customer in customers:
            export_data.append({
                'ID': customer.get('id'),
                'Ad': customer.get('name'),
                'Şirket': customer.get('company_name', 'N/A'),
                'Email': customer.get('email', 'N/A'),
                'Telefon': customer.get('phone', 'N/A'),
                'İletişim Kişisi': customer.get('contact_person', 'N/A'),
                'Oluşturulma': customer.get('created_at')
            })
        return export_data

