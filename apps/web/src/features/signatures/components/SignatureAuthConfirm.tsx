'use client';

type AuthMethod = 'password' | 'pin';

type Props = {
  authMethod: AuthMethod;
  comment: string;
  confirmed: boolean;
  passwordOrPin: string;
  usernameReentry: string;
  setAuthMethod: (value: AuthMethod) => void;
  setComment: (value: string) => void;
  setConfirmed: (value: boolean) => void;
  setPasswordOrPin: (value: string) => void;
  setUsernameReentry: (value: string) => void;
};

export function SignatureAuthConfirm({
  authMethod,
  comment,
  confirmed,
  passwordOrPin,
  setAuthMethod,
  setComment,
  setConfirmed,
  setPasswordOrPin,
  setUsernameReentry,
  usernameReentry
}: Props) {
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">
          Username / Email
          <input
            className="psm-input px-3 text-sm normal-case"
            placeholder="Re-enter username or email"
            value={usernameReentry}
            onChange={(event) => setUsernameReentry(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)]">
          Verification Method
          <select className="psm-input px-3 text-sm normal-case" value={authMethod} onChange={(event) => setAuthMethod(event.target.value as AuthMethod)}>
            <option value="pin">Signature PIN</option>
            <option value="password">Password</option>
          </select>
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)] sm:col-span-2">
          {authMethod === 'pin' ? 'Signature PIN' : 'Password'}
          <input
            className="psm-input px-3 text-sm normal-case"
            type="password"
            placeholder={authMethod === 'pin' ? 'Signature PIN' : 'Password'}
            value={passwordOrPin}
            onChange={(event) => setPasswordOrPin(event.target.value)}
          />
        </label>
        <label className="space-y-1 text-xs font-semibold uppercase tracking-wide text-[var(--psm-muted)] sm:col-span-2">
          Comment
          <textarea
            className="psm-input min-h-20 px-3 py-2 text-sm normal-case"
            placeholder="Optional comment"
            value={comment}
            onChange={(event) => setComment(event.target.value)}
          />
        </label>
      </div>
      <label className="flex gap-3 rounded-lg border border-[var(--psm-line)] p-3 text-sm">
        <input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
        <span>I understand this electronic signature is equivalent to my handwritten signature for this system record.</span>
      </label>
    </div>
  );
}

