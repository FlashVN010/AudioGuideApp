import type { POIListItem } from '@/types/poi';
import { Star, MapPin, Bookmark } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { formatDistance } from '@/utils/format';
import { cn } from '@/utils/cn';

interface POICardProps {
  poi: POIListItem;
  onClick?: () => void;
  onToggleFavorite?: (id: number, isFavorite: boolean) => void;
}

const PRICE_LABELS: Record<string, string> = { '1': '$', '2': '$$', '3': '$$$' };

export default function POICard({ poi, onClick, onToggleFavorite }: POICardProps) {
  const { t } = useTranslation();

  return (
    <div
      onClick={onClick}
      className="group flex gap-3 p-3 bg-card border border-border rounded-[var(--radius-lg)] hover:border-border-hover hover:shadow-md transition-all duration-200 cursor-pointer select-none"
    >
      {/* Image */}
      <div className="relative shrink-0 w-20 h-20 rounded-[var(--radius-md)] overflow-hidden bg-surface-alt">
        {poi.imageUrl ? (
          <img
            src={poi.imageUrl}
            alt={poi.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-muted">
            <MapPin size={20} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col justify-between min-w-0 py-0.5">
        <div>
          {/* Title row */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="font-semibold text-sm leading-snug text-text-primary group-hover:text-primary transition-colors line-clamp-1 tracking-tight">
              {poi.name}
            </h3>
            <button
              type="button"
              onClick={e => { e.stopPropagation(); onToggleFavorite?.(poi.id, !poi.isFavorite); }}
              className={cn(
                'shrink-0 p-1 rounded-[var(--radius-sm)] transition-colors outline-none cursor-pointer',
                poi.isFavorite
                  ? 'text-text-primary'
                  : 'text-text-muted hover:text-text-secondary'
              )}
              aria-label={poi.isFavorite ? t('poi.removeFavorite') : t('poi.addFavorite')}
            >
              <Bookmark size={13} className={poi.isFavorite ? 'fill-current' : ''} />
            </button>
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-2 text-xs text-text-muted mb-1.5">
            {poi.rating > 0 && (
              <span className="flex items-center gap-0.5 text-text-secondary font-medium">
                <Star size={11} className="fill-current text-text-primary" />
                {poi.rating.toFixed(1)}
              </span>
            )}
            {poi.reviewCount > 0 && (
              <span>· {poi.reviewCount} {t('poi.reviews', 'reviews')}</span>
            )}
            {poi.priceRange && (
              <span className="font-medium text-text-secondary">· {PRICE_LABELS[poi.priceRange]}</span>
            )}
            <span className="capitalize">· {poi.category}</span>
          </div>

          {/* Description */}
          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">
            {poi.shortDescription}
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
          {poi.distanceMeters != null && (
            <span className="flex items-center gap-1 text-[11px] text-text-muted">
              <MapPin size={10} />
              {formatDistance(poi.distanceMeters)}
            </span>
          )}
          {poi.approvalStatus && poi.approvalStatus !== 'approved' && (
            <span className={cn(
              'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-[var(--radius-sm)] border',
              poi.approvalStatus === 'pending'
                ? 'bg-surface-alt border-border text-text-muted'
                : 'bg-danger/8 border-danger/30 text-danger'
            )}>
              {poi.approvalStatus}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}