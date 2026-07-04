import React from 'react';
import PropTypes from 'prop-types';

/**
 * StageRail
 *
 * Horizontal wrapper that lays out stage columns left-to-right with a
 * connective "momentum rail" beneath them. Scrolls horizontally on its own
 * (overflow-x-auto) so the page itself never scrolls sideways.
 */
function StageRail({ stages = [], children = null }) {
  const list = Array.isArray(stages) ? stages : [];
  const total = list.length;

  // Find the furthest stage (rightmost) that has population, so the
  // momentum-fill lime segment can extend through it.
  let lastPopulatedIndex = -1;
  list.forEach((stage, index) => {
    if (stage && Number(stage.count) > 0) {
      lastPopulatedIndex = index;
    }
  });

  const fillPercent =
    total > 0 && lastPopulatedIndex >= 0
      ? ((lastPopulatedIndex + 1) / total) * 100
      : 0;

  return (
    <div className="stage-rail w-full">
      <div className="stage-rail__scroll overflow-x-auto">
        <div className="stage-rail__inner min-w-max">
          {/* Columns */}
          <div className="stage-rail__columns flex flex-row items-start gap-4">
            {children}
          </div>

          {/* Momentum rail */}
          {total > 0 && (
            <div className="stage-rail__track relative mt-3 h-2 w-full">
              <div className="stage-rail__line absolute inset-y-0 left-0 right-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-white/10" />
              <div
                className="momentum-fill absolute inset-y-0 left-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-rare-lime transition-all duration-500 ease-out"
                style={{ width: `${fillPercent}%` }}
              />
              <div className="stage-rail__nodes relative flex h-2 w-full items-center justify-between">
                {list.map((stage) => {
                  const populated = Number(stage && stage.count) > 0;
                  return (
                    <span
                      key={stage.id}
                      className={
                        'stage-rail__node h-2 w-2 rounded-full ' +
                        (populated ? 'bg-rare-lime' : 'bg-white/15')
                      }
                      title={stage.label}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

StageRail.propTypes = {
  stages: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      label: PropTypes.string,
      count: PropTypes.number,
    })
  ),
  children: PropTypes.node,
};

export default StageRail;
