import type { ElectronicSignature, SignatureProfile } from '../services/signature.service';

interface VectorData {
  imageDataUrl?: string;
  strokes?: Array<Array<{ x: number; y: number }>>;
  width?: number;
  height?: number;
}

export function SignaturePreview({ 
  profile, 
  signature 
}: { 
  profile?: SignatureProfile | null; 
  signature?: ElectronicSignature | null; 
}) {
  // 1. Normalize the method string (handles casing differences safely)
  const rawMethod = signature?.signature_snapshot_method ?? profile?.signature_method;
  const method = rawMethod?.trim();
  const isDraw = method?.toLowerCase() === 'draw';
  const isInitials = method?.toLowerCase() === 'initials';

  const text = signature?.signature_snapshot_text ?? profile?.signature_text ?? profile?.full_name;
  const imageUrl = signature?.signature_snapshot_image_url ?? profile?.signature_image_url;

  // 2. Safe JSON Parsing for the vector field
  const rawVector = signature?.signature_snapshot_vector_json ?? profile?.signature_vector_json;
  const vector: VectorData | null = (() => {
    if (!rawVector) return null;
    if (typeof rawVector === 'string') {
      try {
        return JSON.parse(rawVector) as VectorData;
      } catch (e) {
        console.error("Failed to parse signature vector JSON:", e);
        return null;
      }
    }
    return rawVector as VectorData;
  })();

  const vectorImage = typeof vector?.imageDataUrl === 'string' ? vector.imageDataUrl : null;
  
  // 3. Fallback initials calculation
  const initials = profile?.initials ?? signature?.signer_full_name
    ?.split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 4)
    .toUpperCase();

  // Determine active asset to render
  const hasImage = !!(imageUrl || vectorImage);

  return (
    <div className="rounded-lg border border-[var(--psm-line)] bg-[var(--psm-surface-2)] p-4">
      <div className="text-xs uppercase tracking-wide text-[var(--psm-muted)]">Signature Preview</div>
      
      <div className="mt-3 flex min-h-24 items-center justify-center rounded-md border border-dashed border-[var(--psm-line)] bg-[var(--psm-bg)] p-4">
        {/* Case 1: Image URL or Vector Data URL exists */}
        {hasImage && (
          <img 
            src={imageUrl || vectorImage || ''} 
            alt="Signature preview" 
            className="max-h-20 max-w-full object-contain" 
          />
        )}

        {/* Case 2: No image, method is Draw, and stroke data is valid */}
        {!hasImage && isDraw && vector && Array.isArray(vector.strokes) && (
          <VectorPreview vector={vector} />
        )}

        {/* Case 3: No image, method is Initials */}
        {!hasImage && isInitials && (
          <div className="text-4xl font-black tracking-wider text-info">
            {initials || text?.slice(0, 2)?.toUpperCase() || '??'}
          </div>
        )}

        {/* Case 4: Fallback Text (Text method or missing configuration) */}
        {!hasImage && !isDraw && !isInitials && (
          <div className="font-serif text-4xl italic text-[var(--psm-text)]">
            {text ?? 'Not configured'}
          </div>
        )}
      </div>
      
      <div className="mt-2 text-xs text-[var(--psm-muted)]">
        Method: {rawMethod ?? 'Not Created'}
      </div>
    </div>
  );
}

function VectorPreview({ vector }: { vector: VectorData }) {
  const strokes = Array.isArray(vector.strokes) ? vector.strokes : [];
  const width = typeof vector.width === 'number' ? vector.width : 760;
  const height = typeof vector.height === 'number' ? vector.height : 220;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-24 w-full max-w-lg">
      <line 
        x1="36" 
        y1={height - 44} 
        x2={width - 36} 
        y2={height - 44} 
        stroke="currentColor" 
        strokeOpacity=".25" 
      />
      {strokes.map((stroke, index) => (
        <polyline 
          key={index} 
          points={stroke.map((point) => `${point.x},${point.y}`).join(' ')} 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="5" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
        />
      ))}
    </svg>
  );
}