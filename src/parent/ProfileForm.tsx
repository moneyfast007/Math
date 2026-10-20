import { useId, useState, type FormEvent } from 'react';
import { t } from '@/i18n';
import { avatarLabel, gradeLabel } from '@/i18n/labels';
import type { Gender } from '@/lang/gender';
import { AVATARS, type AvatarId } from '@/profiles/avatars';
import { MAX_NAME_LENGTH, type Profile, type ProfileInput } from '@/state/schema';
import type { Grade } from '@/ui/ageBand';
import { Avatar } from '@/ui/Avatar';
import { ConfirmDialog, Dialog } from '@/ui/Dialog';

const GRADES: readonly Grade[] = [0, 1, 2, 3, 4, 5, 6];
const GENDERS: readonly Gender[] = ['f', 'm'];

interface ProfileFormProps {
  /** Existing profile to edit, or undefined to create a new one. */
  profile?: Profile;
  onSave: (input: ProfileInput) => void;
  onDelete?: () => void;
  onClose: () => void;
}

export function ProfileForm({ profile, onSave, onDelete, onClose }: ProfileFormProps) {
  const nameId = useId();
  const [name, setName] = useState(profile?.name ?? '');
  const [avatar, setAvatar] = useState<AvatarId>(profile?.avatar ?? 'fox');
  const [grade, setGrade] = useState<Grade>(profile?.grade ?? 0);
  const [gender, setGender] = useState<Gender>(profile?.gender ?? 'f');
  const [allowLevelChange, setAllowLevelChange] = useState(
    profile?.settings.allowLevelChange ?? true,
  );
  const [sounds, setSounds] = useState(profile?.settings.sounds ?? true);
  const [error, setError] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (name.trim().length === 0) {
      setError(true);
      return;
    }
    onSave({
      name: name.trim(),
      avatar,
      grade,
      gender,
      settings: { allowLevelChange, ...(sounds ? {} : { sounds: false }) },
    });
  };

  if (confirmDelete && profile && onDelete) {
    return (
      <ConfirmDialog
        title={t('profile.deleteTitle', { params: { name: profile.name } })}
        body={t('profile.deleteBody', { params: { name: profile.name } })}
        confirmLabel={t('profile.deleteConfirm')}
        danger
        onConfirm={onDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    );
  }

  return (
    <Dialog
      title={profile ? t('profile.editTitle') : t('profile.newTitle')}
      onClose={onClose}
      actions={
        <>
          {profile && onDelete ? (
            <button
              type="button"
              className="btn btn--ghost profile-form__delete"
              onClick={() => setConfirmDelete(true)}
            >
              {t('profile.delete')}
            </button>
          ) : null}
          <button type="button" className="btn btn--secondary" onClick={onClose}>
            {t('action.cancel')}
          </button>
          <button type="button" className="btn" onClick={() => submit()}>
            {t('profile.save')}
          </button>
        </>
      }
    >
      <form className="stack profile-form" onSubmit={submit} noValidate>
        {/* What the child will see on her card, as it is being chosen. */}
        <div className="profile-form__preview" aria-hidden="true">
          <Avatar id={avatar} size="md" decorative />
          <span className="profile-form__preview-name">{name.trim() || ' '}</span>
        </div>
        <div className="field">
          <label htmlFor={nameId}>{t('profile.name')}</label>
          <input
            id={nameId}
            className="text-input"
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder={t('profile.namePlaceholder')}
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            enterKeyHint="done"
            onChange={(e) => {
              setName(e.target.value);
              setError(false);
            }}
          />
          {error ? (
            <span className="form-error" role="alert">
              {t('profile.nameRequired')}
            </span>
          ) : null}
        </div>

        <fieldset className="field">
          <legend>{t('profile.avatar')}</legend>
          <div className="choices">
            {AVATARS.map((a) => (
              <label key={a.id} className="choice choice--avatar">
                <input
                  type="radio"
                  name="avatar"
                  value={a.id}
                  checked={avatar === a.id}
                  onChange={() => setAvatar(a.id)}
                  aria-label={avatarLabel(a.id)}
                />
                <Avatar id={a.id} size="sm" decorative />
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>{t('profile.grade')}</legend>
          <div className="choices">
            {GRADES.map((g) => (
              <label key={g} className="choice">
                <input
                  type="radio"
                  name="grade"
                  value={g}
                  checked={grade === g}
                  onChange={() => setGrade(g)}
                />
                {gradeLabel(g)}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="field">
          <legend>{t('profile.gender')}</legend>
          <div className="choices">
            {GENDERS.map((g) => (
              <label key={g} className="choice">
                <input
                  type="radio"
                  name="gender"
                  value={g}
                  checked={gender === g}
                  onChange={() => setGender(g)}
                />
                {t(`profile.gender.${g}`)}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="toggle">
          <input
            type="checkbox"
            checked={allowLevelChange}
            onChange={(e) => setAllowLevelChange(e.target.checked)}
          />
          {t('profile.allowLevelChange')}
        </label>

        <label className="toggle">
          <input type="checkbox" checked={sounds} onChange={(e) => setSounds(e.target.checked)} />
          {t('profile.sounds')}
        </label>
      </form>
    </Dialog>
  );
}
