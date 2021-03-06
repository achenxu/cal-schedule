#!/usr/bin/env python2

import json

with open('data/schedule_new.json', 'r') as f:
    schedule = json.load(f)

with open('data/berkeley_time_ids.json', 'r') as f:
    btime_ids = json.load(f)
    
header = schedule['header']
data = schedule['data']

data_d = [dict(zip(header, d)) for d in data]
data_d = [d for d in data_d if d['Start Time'] != '0:00' and d['Start Time'] != '']

classes = {}

## group by class
for row in data_d:
    if row['Start Time'] == row['End Time'] and \
       (row['Start Time'] == '0:00' or row['Start Time'] == ''):
        continue

    if row['Course Component'] == 'GRP':
        continue

    try:
        start = float(row['Start Time'])
        end = float(row['End Time'])

        start = round(start * 24 * 4) / 4
        end = round(end * 24 * 4) / 4

        row['Start Time'] = '{}:{:02d}'.format(int(start), int((start % 1) * 60))
        row['End Time'] = '{}:{:02d}'.format(int(end), int((end % 1) * 60))
    except ValueError:
        pass
    # key = (row['Subject'], row['Catalog Number'], row['Course Title'])
    # key = (row['Subject'], row['Catalog Number'])
    key = '{} {}'.format(row['Subject'], row['Catalog Number'])

    row['Key'] = key
    row['Berkeleytime'] = btime_ids.get(key)

    if key not in btime_ids:
        print(key)

    if key not in classes:
        classes[key] = []

    classes[key].append(row)

## take care of doubles with different instructors (co-teaching case)
for key, rows in classes.items():
    GROUPS = {}

    for row in rows:
        num = row['Class Number']
        if num in GROUPS:
            GROUPS[num]['Instructor Name']  += '; ' + row['Instructor Name']
        else:
            GROUPS[num] = row

    rows_new = [x[1] for x in GROUPS.items()]
    classes[key] = rows_new

## take care of section numbers
## figure out which sections correspond with which lecture

## 3 different versions
## multiple lectures: DISC and LAB are properly labeled corresponding to lecture (first digit)
## 1 lecture: all LABS, DISC, whatever should match the lecture, sometimes don't (see ELENG 16A, ELENG 118)
## multiple lectures: more lab/disc numbers than lectures, all LAB/DISC numbers should match

## how to get main section
## if just one type, then that one is main
## otherwise use this ordering (this takes care of all the classes)
## LEC > SEM >  ... > LAB > DIS

def get_main(section_types):
    if len(section_types) == 1:
        return list(section_types)[0]

    section_types = set(section_types)

    section_types.discard('DIS')

    if len(section_types) == 1:
        return list(section_types)[0]

    section_types.discard('LAB')

    if len(section_types) == 1:
        return list(section_types)[0]

    if 'LEC' in section_types:
        return 'LEC'
    elif 'SEM' in section_types:
        return 'SEM'

dd = {}

classes_sections = {}

for key, rows in classes.items():
    possible = set([row['Course Component'] for row in rows])
    main = get_main(possible)

    nums_main = set([row['Section'].strip('0')[0] for row in rows if row['Course Component'] == main])
    nums_other = set([row['Section'].strip('0')[0] for row in rows if row['Course Component'] != main])

    for row in rows:
        if row['Course Component'] == main:
            row['Section Type'] = 'main'
        else:
            row['Section Type'] = 'other'


    if nums_main != nums_other and len(nums_other) != 0:
        ## weird numbers
        ## match anything with main!!!
        for row in rows:
            row['Section Number'] = 'x'
        sects = {'x'}
    else:
        ## strict matching
        for row in rows:
            row['Section Number'] = row['Section'].strip('0')[0]
        sects = nums_main

    sections = {}
    for sect in sects:
        sections[sect] = {}
        for t in possible:
            sections[sect][t] = []

    rows = sorted(rows, key=lambda x: x['Section'])
            
    for row in rows:
        sect = row['Section Number']
        t = row['Course Component']
        sections[sect][t].append(row)

    classes_sections[key] = {}
    classes_sections[key]['info'] = rows[0]
    classes_sections[key]['sections'] = sections

with open('data/schedule_grouped.json', 'w') as f:
    json.dump(classes_sections, f, sort_keys=True)

