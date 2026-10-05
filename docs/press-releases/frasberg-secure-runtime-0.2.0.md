# FOR IMMEDIATE RELEASE

## Frasberg Secure Runtime 0.2.0 adds shared GT6 broadcast state and a Studio control room

**October 5, 2026**

Frasberg Secure Runtime 0.2.0 adds a buildable Studio interface served by the
runtime gateway, GT6 broadcast planning, replay navigation, race analytics,
and durable creator and export-job records shared across ECS tasks.

The release stores runtime records in DynamoDB and rendered export artifacts in
a private S3 bucket. Download links are time-limited. Studio provides broadcast
playback controls, deterministic camera planning, story editing, analytics,
and access to GitHub release notes.

The media export path is an initial infrastructure milestone, not a completed
race-video renderer: it currently produces a color-placeholder MP4 and does
not mux commentary or render GT6 scene footage. LiveKit streaming and payment
processing are not included in this release.

### Availability

The release is published at
https://github.com/frasberg-code/frasberg-secure-runtime/releases/tag/v0.2.0.
