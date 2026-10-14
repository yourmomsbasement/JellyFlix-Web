import React, { type FC, useMemo } from 'react';

import { CardShape } from 'components/cardbuilder/utils/shape';
import globalize from 'lib/globalize';

import { getDescriptionOnlyMatches, useDescriptionSearch } from '../api/useDescriptionSearch';
import SearchResultsRow from './SearchResultsRow';

const CARD_OPTIONS = {
    shape: CardShape.PortraitOverflow,
    scalable: true,
    showTitle: true,
    showYear: true,
    overlayText: false,
    centerText: true,
    allowBottomPadding: false
};

/**
 * JellyFlix: titles whose plot, tagline, genres, keywords or cast match what was typed, so "space movie with a
 * stranded astronaut" finds The Martian. Titles that name search already shows are left out.
 */
const DescriptionResults: FC<{ query: string }> = ({ query }) => {
    const { data } = useDescriptionSearch(query.trim());
    const items = useMemo(() => getDescriptionOnlyMatches(data, query), [ data, query ]);
    if (!items.length) return null;

    return (
        <div className='padded-bottom-page'>
            <SearchResultsRow
                title={globalize.translate('MatchesYourDescription')}
                items={items}
                cardOptions={CARD_OPTIONS}
            />
        </div>
    );
};

export default DescriptionResults;
