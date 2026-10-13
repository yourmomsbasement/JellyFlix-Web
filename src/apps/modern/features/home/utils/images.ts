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

const parentThumb = (item: BaseItemDto): ImageRef | undefined => {
    if (item.ParentThumbItemId && item.ParentThumbImageTag) {
        return { itemId: item.ParentThumbItemId, type: ImageType.Thumb, tag: item.ParentThumbImageTag };
    }
    if (item.SeriesId && item.SeriesThumbImageTag) {
        return { itemId: item.SeriesId, type: ImageType.Thumb, tag: item.SeriesThumbImageTag };
    }
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
 * 16:9 artwork for row tiles. Episodes use their own still (so Continue Watching shows where you are);
 * everything else prefers thumbs, then backdrops, then the poster.
 */
export const getLandscapeImageUrl = (api: Api | undefined, item: BaseItemDto, maxWidth = 640) => {
    const ref = item.Type === BaseItemKind.Episode ?
        ownImage(item, ImageType.Primary) ?? parentThumb(item) ?? parentBackdrop(item) :
        ownImage(item, ImageType.Thumb) ?? ownImage(item, ImageType.Backdrop) ?? parentThumb(item) ?? parentBackdrop(item) ?? ownImage(item, ImageType.Primary);
    return toUrl(api, ref, maxWidth);
};

/** Whether the tile artwork already shows the title (thumbs usually do), so no text label is needed on top. */
export const hasTitleInArtwork = (item: BaseItemDto) =>
    item.Type !== BaseItemKind.Episode && !!item.ImageTags?.[ImageType.Thumb];
