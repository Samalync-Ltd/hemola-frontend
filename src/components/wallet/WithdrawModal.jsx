import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { walletService } from '../../services/api';
import { isValidSaudiIban, normalizeIban, formatIban, BANK_ACCOUNT_NAME_MAX } from '../../utils/validators';

/**
 * Withdrawal request with the carrier's bank details (IBAN + account holder
 * name). The backend refuses a withdrawal until both are saved on the
 * profile (INTEGRATION.md §12 requestWithdrawal), and snapshots them onto
 * the withdrawal so the admin knows where to transfer.
 *
 * `savedBankDetails` pre-fills the form; details are only re-saved (via
 * updateBankDetails) when they're new or were edited. `onCompleted` fires
 * after a successful request so the parent can refresh and close.
 */
export const WithdrawModal = ({ isOpen, onClose, onCompleted, currentBalance, savedBankDetails }) => {
    const [amount, setAmount] = useState('');
    const [iban, setIban] = useState('');
    const [accountName, setAccountName] = useState('');
    const [errors, setErrors] = useState({});
    const [status, setStatus] = useState('idle'); // idle | processing | success
    const [result, setResult] = useState(null);

    const hasSaved = !!(savedBankDetails?.iban && savedBankDetails?.bankAccountName);

    useEffect(() => {
        if (isOpen) {
            setAmount('');
            setIban(savedBankDetails?.iban ? formatIban(savedBankDetails.iban) : '');
            setAccountName(savedBankDetails?.bankAccountName || '');
            setErrors({});
            setStatus('idle');
            setResult(null);
        }
    }, [isOpen, savedBankDetails?.iban, savedBankDetails?.bankAccountName]);

    if (!isOpen) return null;

    const validate = () => {
        const next = {};
        const numAmount = Number(amount);
        if (!amount || isNaN(numAmount) || numAmount <= 0) next.amount = 'يرجى إدخال مبلغ صحيح أكبر من صفر';
        else if (numAmount > currentBalance) next.amount = 'الرصيد المتاح غير كافٍ لإتمام عملية السحب';
        else if (Math.round(numAmount * 100) !== numAmount * 100) next.amount = 'المبلغ يقبل خانتين عشريتين كحد أقصى';

        if (!iban.trim()) next.iban = 'رقم الآيبان مطلوب';
        else if (!isValidSaudiIban(iban)) next.iban = 'رقم الآيبان غير صحيح — يبدأ بـ SA ويتكون من 24 خانة، تأكد من عدم وجود خطأ في الأرقام';

        if (!accountName.trim()) next.accountName = 'اسم صاحب الحساب مطلوب';
        else if (accountName.trim().length > BANK_ACCOUNT_NAME_MAX) next.accountName = `الاسم يجب ألا يتجاوز ${BANK_ACCOUNT_NAME_MAX} حرفاً`;

        setErrors(next);
        return Object.keys(next).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validate()) return;

        const normalizedIban = normalizeIban(iban);
        const name = accountName.trim();
        const changed = normalizedIban !== normalizeIban(savedBankDetails?.iban)
            || name !== (savedBankDetails?.bankAccountName || '').trim();

        setStatus('processing');
        try {
            if (changed) await walletService.saveBankDetails(normalizedIban, name);
            const res = await walletService.withdraw(Number(amount));
            setResult({ iban: res.iban || normalizedIban, bankAccountName: res.bankAccountName || name });
            setStatus('success');
            setTimeout(() => onCompleted?.(), 1800);
        } catch (err) {
            setStatus('idle');
            setErrors({ form: err.message || 'حدث خطأ أثناء إرسال طلب السحب' });
        }
    };

    const busy = status === 'processing';
    const fieldError = (key) => errors[key] && <div style={{ color: 'var(--color-error)', fontSize: 12, marginTop: 4 }}>{errors[key]}</div>;

    const modalContent = (
        <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            overflowY: 'auto',
            padding: '16px 0',
        }}>
            <div style={{ width: 440, maxWidth: '92%' }}>
                <Card>
                    <h3 style={{ marginBottom: 16 }}>سحب الرصيد</h3>

                    <div style={{ marginBottom: 16, padding: '12px', backgroundColor: 'var(--color-surface)', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>الرصيد المتاح:</span>
                            <span style={{ fontWeight: 'bold' }} dir="ltr">{currentBalance} ر.س</span>
                        </div>
                    </div>

                    {status === 'success' ? (
                        <div style={{ textAlign: 'center', padding: '16px 0' }}>
                            <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: 'var(--color-success)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>✓</div>
                            <h4 style={{ margin: 0, color: 'var(--color-success)' }}>تم إرسال طلب السحب</h4>
                            <p className="text-helper" style={{ marginTop: 8 }}>سيتم تحويل المبلغ بعد مراجعة الإدارة إلى:</p>
                            <div style={{ fontWeight: 600 }}>{result?.bankAccountName}</div>
                            <div dir="ltr" style={{ fontFamily: 'monospace', fontSize: 14 }}>{formatIban(result?.iban)}</div>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>المبلغ المراد سحبه (ر.س)</label>
                                <Input
                                    type="number"
                                    placeholder="أدخل المبلغ"
                                    value={amount}
                                    onChange={e => { setAmount(e.target.value); setErrors(prev => ({ ...prev, amount: null, form: null })); }}
                                    min="1"
                                    max={currentBalance}
                                    disabled={busy}
                                />
                                {fieldError('amount')}
                            </div>

                            <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: 16 }}>
                                <div style={{ fontWeight: 600, marginBottom: 4 }}>بيانات الحساب البنكي</div>
                                <p className="text-helper" style={{ fontSize: 12, margin: '0 0 12px' }}>
                                    {hasSaved
                                        ? 'سيتم التحويل إلى الحساب المحفوظ أدناه. يمكنك تعديله قبل الإرسال.'
                                        : 'أضف الحساب البنكي الذي سيتم تحويل المبلغ إليه. سيتم حفظه لطلبات السحب القادمة.'}
                                </p>
                                <label style={{ display: 'block', marginBottom: 8, fontSize: 14 }}>رقم الآيبان (IBAN)</label>
                                <Input
                                    placeholder="SA00 0000 0000 0000 0000 0000"
                                    value={iban}
                                    onChange={e => { setIban(e.target.value.toUpperCase()); setErrors(prev => ({ ...prev, iban: null, form: null })); }}
                                    onBlur={() => { if (isValidSaudiIban(iban)) setIban(formatIban(iban)); }}
                                    dir="ltr"
                                    maxLength={34}
                                    disabled={busy}
                                />
                                {fieldError('iban')}
                                <label style={{ display: 'block', margin: '12px 0 8px', fontSize: 14 }}>اسم صاحب الحساب</label>
                                <Input
                                    placeholder="كما هو مسجل لدى البنك"
                                    value={accountName}
                                    onChange={e => { setAccountName(e.target.value); setErrors(prev => ({ ...prev, accountName: null, form: null })); }}
                                    maxLength={BANK_ACCOUNT_NAME_MAX}
                                    disabled={busy}
                                />
                                {fieldError('accountName')}
                            </div>

                            {errors.form && (
                                <div style={{ padding: 12, borderRadius: 8, backgroundColor: 'rgba(229,62,62,0.08)', color: 'var(--color-error)', fontSize: 13 }}>
                                    {errors.form}
                                </div>
                            )}

                            <p style={{ fontSize: 12, color: 'var(--color-text-muted)', margin: 0 }}>
                                سيتم حجز المبلغ فوراً وتحويله بعد موافقة الإدارة على الطلب.
                            </p>

                            <div style={{ display: 'flex', gap: 12 }}>
                                <Button type="submit" disabled={busy} style={{ flex: 1 }} isLoading={busy}>
                                    {busy ? 'جاري الإرسال...' : 'تأكيد سحب الرصيد'}
                                </Button>
                                <Button type="button" variant="outline" onClick={onClose} disabled={busy} style={{ flex: 1 }}>
                                    إلغاء
                                </Button>
                            </div>
                        </form>
                    )}
                </Card>
            </div>
        </div>
    );

    return createPortal(modalContent, document.body);
};
