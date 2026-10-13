import type { Api } from '@jellyfin/sdk';
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client/models/base-item-dto';
import { BaseItemKind } from '@jellyfin/sdk/lib/generated-client/models/base-item-kind';
import { ImageType } from '@jellyfin/sdk/lib/generated-client/models/image-type';
import { getImageApi } from '@jellyfin/sdk/lib/utils/api/image-api';

interface ImageRef {
    itemId: string
    type: ImageType
    tag: string
}

const toUrl = (api: Api | undefined, ref: ImageRef | undefined, maxWidth: number) => {
    if (!api || !ref) return undefined;
    return getImageApi(api).getItemImageUrlById(ref.itemId, ref.type, { tag: ref.tag, maxWidth, quality: 90 });
};

const ownImage = (item: BaseItemDto, type: ImageType): ImageRef | undefined => {
    const tag = type === ImageType.Backdrop ? item.BackdropImageTags?.[0] : item.ImageTags?.[type];
    return item.Id && tag ? { itemId: item.Id, type, tag } : undefined;
};

const parentBackdrop = (item: BaseItemDto): ImageRef | undefined => {
    const tag = item.ParentBackdropImageTags?.[0];
    return item.ParentBackdropItemId && tag ? { itemId: item.ParentBackdropItemId, type: ImageType.Backdrop, tag } : undefined;
};

/** Full-bleed background art for the hero banner. */
export const getBackdropUrl = (api: Api | undefined, item: BaseItemDto, maxWidth = 1920) =>
    toUrl(api, ownImage(item, ImageType.Backdrop) ?? parentBackdrop(item), maxWidth);

/** The title logo (transparent artwork with the show's name), if the item or its series has one. */
export const getLogoUrl = (api: Api | undefined, item: BaseItemDto, maxWidth = 800) => {
    const parentLogo = item.ParentLogoItemId && item.ParentLogoImageTag ?
        { itemId: item.ParentLogoItemId, type: ImageType.Logo, tag: item.ParentLogoImageTag } :
        undefined;
    return toUrl(api, ownImage(item, ImageType.Logo) ?? parentLogo, maxWidth);
};

/**
 * 2:3 poster artwork for row tiles. Episodes and seasons use their series' poster, so a show looks the
 * same wherever it appears (the episode is labelled on the tile instead).
 */
export const getPosterUrl = (api: Api | undefined, item: BaseItemDto, maxWidth = 400) => {
    const seriesPoster = item.SeriesId && item.SeriesPrimaryImageTag ?
        { itemId: item.SeriesId, type: ImageType.Primary, tag: item.SeriesPrimaryImageTag } :
        undefined;
    const ref = item.Type === BaseItemKind.Episode ?
        seriesPoster ?? ownImage(item, ImageType.Primary) :
        ownImage(item, ImageType.Primary) ?? seriesPoster;
    return toUrl(api, ref, maxWidth);
};
