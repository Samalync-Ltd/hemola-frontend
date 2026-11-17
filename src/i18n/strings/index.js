// Every text of the platform, by area. Each entry is { ar, en }.
import shell from './shell';
import enums from './enums';
import errors from './errors';
import files from './files';
import dashboard from './dashboard';
import auth from './auth';
import shipments from './shipments';
import offers from './offers';
import trips from './trips';
import wallet from './wallet';
import account from './account';
import notifications from './notifications';

export const strings = {
    ...shell,
    enums,
    errors,
    files,
    dashboard,
    auth,
    shipments,
    offers,
    trips,
    wallet,
    account,
    notifications,
};
