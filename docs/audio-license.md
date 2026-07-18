# Audio provenance

The invitation does not ship or stream a third-party recording. `AmbientMusic` synthesizes a short original pentatonic pattern at runtime with the browser Web Audio API.

- No copyrighted recording or external music URL is included.
- Sound starts only after the guest presses the sound button, satisfying browser autoplay rules.
- The component stops and closes its audio context when muted or unmounted.

If this generated melody is replaced with a recording, record the track title, author, source URL, license text, download date, and proof of purchase/permission in this file before deployment.
