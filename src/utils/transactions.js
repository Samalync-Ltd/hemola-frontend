import { t } from '../i18n';

// The backend writes a transaction's `description` in English
// (hemooltak-backend functions/src/money.ts, wallet.ts, cancellation.ts).
// The ones it writes itself are shown in the user's language; anything else
// (e.g. a note an admin typed) is shown exactly as written.
const KNOWN = {
    'Platform commission, withheld from the settlement.': 'wallet.description.commissionWithheld',
    'Outstanding debt recovered from the settlement.': 'wallet.description.debtFromSettlement',
    'Outstanding debt cleared from a top-up.': 'wallet.description.debtFromTopUp',
    'Withdrawal paid out.': 'wallet.description.withdrawalPaid',
};
const CANCELLATION = /^Cancellation commission \((shipper|carrier) cancelled after assignment\)\.$/i;

export const transactionDescription = (description) => {
    if (!description) return '-';
    if (KNOWN[description]) return t(KNOWN[description]);
    const cancellation = description.match(CANCELLATION);
    if (cancellation) {
        return t('wallet.description.cancellationCommission', { who: t(`wallet.description.${cancellation[1].toLowerCase()}`) });
    }
    return description;
};
