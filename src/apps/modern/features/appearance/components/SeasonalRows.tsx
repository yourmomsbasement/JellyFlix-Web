import React, { type FC, type ReactNode } from 'react';

import globalize from 'lib/globalize';

import type { SeasonalShelf } from '../api/useAppearance';

interface SeasonalRowsProps {
    shelves: SeasonalShelf[] | undefined
    /** Draws a row with whichever row component the layout uses. */
    renderRow: (title: string, shelf: SeasonalShelf) => ReactNode
}

/** The season's curated shelves. */
const SeasonalRows: FC<SeasonalRowsProps> = ({ shelves, renderRow }) => (
    shelves?.map(shelf => <React.Fragment key={shelf.Key}>{renderRow(globalize.translate(shelf.Key), shelf)}</React.Fragment>)
);

export default SeasonalRows;
