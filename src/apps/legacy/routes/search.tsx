import type { CollectionType } from '@jellyfin/sdk/lib/generated-client/models/collection-type';
import React, { type FC } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDebounceValue } from 'usehooks-ts';

import { getDescriptionOnlyMatches, useDescriptionSearch } from 'apps/legacy/features/search/api/useDescriptionSearch';
import DescriptionResults from 'apps/legacy/features/search/components/DescriptionResults';
import RequestResults from 'apps/legacy/features/search/components/RequestResults';
import SearchFields from 'apps/legacy/features/search/components/SearchFields';
import SearchResults from 'apps/legacy/features/search/components/SearchResults';
import SearchSuggestions from 'apps/legacy/features/search/components/SearchSuggestions';
import Page from 'components/Page';
import useSearchParam from 'hooks/useSearchParam';
import globalize from 'lib/globalize';

const COLLECTION_TYPE_PARAM = 'collectionType';
const PARENT_ID_PARAM = 'parentId';
const QUERY_PARAM = 'query';

const Search: FC = () => {
    const [searchParams] = useSearchParams();
    const parentIdQuery = searchParams.get(PARENT_ID_PARAM) || undefined;
    const collectionTypeQuery = (searchParams.get(COLLECTION_TYPE_PARAM) || undefined) as CollectionType | undefined;
    const [ query, setQuery ] = useSearchParam(QUERY_PARAM);
    const [debouncedQuery] = useDebounceValue(query, 500);
    // JellyFlix: global search also matches descriptions ("space movie with a stranded astronaut")
    const descriptionQuery = parentIdQuery ? undefined : debouncedQuery?.trim();
    const { data: descriptionMatches } = useDescriptionSearch(descriptionQuery);
    const hasDescriptionMatches = !!descriptionQuery && getDescriptionOnlyMatches(descriptionMatches, descriptionQuery).length > 0;

    return (
        <Page
            id='searchPage'
            title={globalize.translate('Search')}
            className='mainAnimatedPage libraryPage allLibraryPage noSecondaryNavPage'
        >
            <SearchFields query={query} onSearch={setQuery} />
            {!debouncedQuery ? (
                <SearchSuggestions
                    parentId={parentIdQuery}
                />
            ) : (
                <>
                    <SearchResults
                        parentId={parentIdQuery}
                        collectionType={collectionTypeQuery}
                        query={debouncedQuery}
                        hasOtherResults={hasDescriptionMatches}
                    />
                    {!parentIdQuery && <DescriptionResults query={debouncedQuery} />}
                    {/* JellyFlix: titles that aren't in the library can be requested (global search only) */}
                    {!parentIdQuery && <RequestResults query={debouncedQuery} />}
                </>
            )}
        </Page>
    );
};

export default Search;
