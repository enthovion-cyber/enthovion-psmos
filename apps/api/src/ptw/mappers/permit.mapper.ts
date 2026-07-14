export class PermitMapper {
  static toSearchText(permit: Record<string, any>) {
    return [permit.permit_number, permit.permit_type, permit.title, permit.work_description, permit.equipment_tag, permit.equipment_name, permit.job_area, permit.status].filter(Boolean).join(' ');
  }
}
