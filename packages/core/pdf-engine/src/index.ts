export type PdfTemplateName = 'permit-certificate' | 'isolation-certificate' | 'startup-certificate' | 'moc-approval-package' | 'hazop-report';

export function renderTemplateName(name: PdfTemplateName): string {
  return `${name}.html`;
}
