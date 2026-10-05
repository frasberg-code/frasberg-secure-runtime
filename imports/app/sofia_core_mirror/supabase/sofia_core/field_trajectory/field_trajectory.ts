/**
 * Field Trajectory - Long-Arc Trajectory Shaping
 * Part of the Field Continuity Triad for Sofia Core
 * 
 * Shapes the long-arc direction of the field by computing trajectory from origin and direction.
 * This is the system's momentum vector — the part that defines where the line is going.
 */

/**
 * Represents the trajectory state with origin and direction
 * 
 * @template T - The type of trajectory components
 */
export type TrajectoryState<T> = {
  origin: T;
  direction: T;
};

/**
 * Compute field trajectory for long-arc direction
 * 
 * @param origin - Starting point of the trajectory
 * @param direction - Direction vector of the trajectory
 * @returns TrajectoryState containing origin and direction
 */
export function computeFieldTrajectory<T>(
  origin: T,
  direction: T
): TrajectoryState<T> {
  return {
    origin,
    direction,
  };
}
